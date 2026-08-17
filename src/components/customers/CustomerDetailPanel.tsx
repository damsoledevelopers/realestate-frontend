'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import {
  archiveCustomer,
  BUYER_CATEGORY_LABELS,
  CUSTOMER_STATUS_LABELS,
  fetchCustomer,
  KYC_STATUS_LABELS,
  uploadCustomerDocument,
} from '@/lib/customers';
import { formatCurrency } from '@/lib/formatLocale';
import type { CustomerDetailResponse } from '@/lib/types';
import { resolveMediaUrl } from '@/lib/media';
import CustomerFormModal from '@/components/customers/CustomerFormModal';

interface CustomerDetailPanelProps {
  customerId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function CustomerDetailPanel({ customerId, onClose, onUpdated }: CustomerDetailPanelProps) {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    if (!token) return;
    setLoading(true);
    fetchCustomer(customerId, token)
      .then(setData)
      .catch((err: unknown) => notify.error(getApiErrorMessage(err, t('customers.loadFailed'))))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [customerId, token]);

  const handleArchive = async () => {
    if (!token || !data) return;
    try {
      await archiveCustomer(customerId, token);
      notify.success(t('customers.archiveSuccess'));
      onUpdated();
      onClose();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('customers.archiveFailed')));
    }
  };

  const handleUpload = async (file: File) => {
    if (!token || !data) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('category', 'other');
      await uploadCustomerDocument(customerId, formData, token);
      notify.success(t('customers.documentUploaded'));
      load();
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('customers.documentFailed')));
    } finally {
      setUploading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="modal-overlay">
        <div className="modal-panel py-12 text-center text-sm text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  const customer = data.customer;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-panel max-w-4xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{customer.name}</h2>
              <p className="text-sm text-gray-500">
                {BUYER_CATEGORY_LABELS[customer.buyerCategory]} · {CUSTOMER_STATUS_LABELS[customer.status]} · {KYC_STATUS_LABELS[customer.kycStatus]}
              </p>
            </div>
            <div className="flex gap-2">
              {customer.status === 'active' && (
                <>
                  <button type="button" onClick={() => setShowEdit(true)} className="btn-secondary text-sm">{t('common.edit')}</button>
                  <button type="button" onClick={handleArchive} className="btn-danger text-sm">{t('customers.archive')}</button>
                </>
              )}
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card space-y-2 text-sm">
              <h3 className="font-semibold text-gray-900">{t('customers.contact')}</h3>
              <p>{customer.phone}</p>
              <p>{customer.email || '—'}</p>
              <p>{customer.address || '—'}</p>
              <p>{[customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || '—'}</p>
              <p className="text-gray-500">{customer.layout?.name}</p>
            </div>
            <div className="card space-y-2 text-sm">
              <h3 className="font-semibold text-gray-900">{t('customers.kycSection')}</h3>
              <p>{t('customers.pan')}: {customer.pan || '—'}</p>
              <p>{t('customers.aadhaar')}: {customer.aadhaarLast4 || '—'}</p>
              <p>{t('customers.gst')}: {customer.gstNumber || '—'}</p>
              <label className="mt-2 block">
                <span className="mb-1 block text-xs font-medium">{t('customers.uploadDocument')}</span>
                <input type="file" className="input-field" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
              </label>
            </div>
          </div>

          <div className="mt-4 card">
            <h3 className="mb-3 font-semibold text-gray-900">{t('customers.assignedProperties')}</h3>
            {customer.assignments.length === 0 ? (
              <p className="text-sm text-gray-400">{t('customers.noAssignments')}</p>
            ) : (
              <div className="space-y-2 text-sm">
                {customer.assignments.map((item) => (
                  <div key={item._id || `${item.entityType}-${item.label}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium">{item.label || item.entityType}</p>
                    <p className="text-gray-500 capitalize">{item.dealStatus} · {item.entityType.replace('_', ' ')}</p>
                    {item.price != null && <p>{formatCurrency(item.price, locale)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 font-semibold text-gray-900">{t('customers.bookingHistory')}</h3>
              {data.bookings.length === 0 ? (
                <p className="text-sm text-gray-400">{t('customers.noBookings')}</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {data.bookings.map((booking) => (
                    <div key={booking._id} className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium">Plot {booking.plotId?.plotNumber || '—'}</p>
                      <p className="capitalize text-gray-500">{booking.status}</p>
                      <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <h3 className="mb-3 font-semibold text-gray-900">{t('customers.paymentHistory')}</h3>
              {data.payments.length === 0 ? (
                <p className="text-sm text-gray-400">{t('customers.noPayments')}</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {data.payments.map((payment) => (
                    <div key={payment._id} className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium">{payment.receiptNumber}</p>
                      <p>{formatCurrency(payment.amount, locale)} · {payment.status}</p>
                      <p className="text-xs text-gray-400">{new Date(payment.paymentDate).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {data.documents.length > 0 && (
            <div className="mt-4 card">
              <h3 className="mb-3 font-semibold text-gray-900">{t('customers.documents')}</h3>
              <ul className="space-y-2 text-sm">
                {data.documents.map((doc) => (
                  <li key={doc._id}>
                    <a href={resolveMediaUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {doc.name} ({doc.category})
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <CustomerFormModal
          customer={customer}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            load();
            onUpdated();
          }}
        />
      )}
    </>
  );
}
