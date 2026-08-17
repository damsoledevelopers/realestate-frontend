'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Plus, Printer, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { downloadPaymentReceipt, printPaymentReceipt } from '@/lib/downloadReceipt';
import { formatCurrency } from '@/lib/formatLocale';
import {
  fetchBookingPayments,
  PAYMENT_MODE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/payments';
import type { LayoutCustomer, PaymentRecord, PaymentSummary } from '@/lib/types';
import PaymentFormModal from '@/components/payments/PaymentFormModal';

interface PaymentHistoryPanelProps {
  customer: LayoutCustomer;
  layoutName: string;
  canManage?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

function PaymentStatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${colors[status] || colors.pending}`}>
      {PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] || status}
    </span>
  );
}

export default function PaymentHistoryPanel({
  customer,
  layoutName,
  canManage = false,
  onClose,
  embedded = false,
}: PaymentHistoryPanelProps) {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchBookingPayments(customer.bookingId, token);
      setPayments(data.payments);
      setSummary(data.summary);
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('payments.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [token, customer.bookingId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const content = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('payments.historyTitle')}</h3>
          <p className="text-sm text-gray-500">
            {customer.customerName} · Plot {customer.plotNumber} · {layoutName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && customer.bookingStatus === 'approved' && (
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-1 text-sm">
              <Plus className="h-4 w-4" />
              {t('payments.record')}
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              {t('common.close')}
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">{t('payments.plotPrice')}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(summary.plotPrice, locale)}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase text-green-700">{t('payments.totalPaid')}</p>
            <p className="mt-1 text-lg font-semibold text-green-800">{formatCurrency(summary.totalPaid, locale)}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase text-amber-700">{t('payments.balanceDue')}</p>
            <p className="mt-1 text-lg font-semibold text-amber-800">{formatCurrency(summary.balanceDue, locale)}</p>
          </div>
        </div>
      )}

      {customer.bookingStatus !== 'approved' && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('payments.approvedOnly')}
        </p>
      )}

      <div className="card">
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('common.loading')}</p>
        ) : payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('payments.empty')}</p>
        ) : (
          <div className="table-wrap">
            <table className="table-data">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-3">{t('payments.receipt')}</th>
                  <th className="px-3 py-3">{t('payments.date')}</th>
                  <th className="px-3 py-3">{t('payments.amount')}</th>
                  <th className="px-3 py-3">{t('payments.mode')}</th>
                  <th className="px-3 py-3">{t('payments.status')}</th>
                  <th className="px-3 py-3">{t('payments.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-3 py-3 font-mono text-xs">{payment.receiptNumber}</td>
                    <td className="px-3 py-3 text-sm">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="px-3 py-3 font-medium">{formatCurrency(payment.amount, locale)}</td>
                    <td className="px-3 py-3 text-sm capitalize">
                      {PAYMENT_MODE_LABELS[payment.paymentMode]}
                    </td>
                    <td className="px-3 py-3">
                      <PaymentStatusPill status={payment.status} />
                    </td>
                    <td className="px-3 py-3">
                      {payment.status === 'success' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => downloadPaymentReceipt(payment)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {t('payments.download')}
                          </button>
                          <button
                            type="button"
                            onClick={() => printPaymentReceipt(payment)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            {t('payments.print')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && summary && (
        <PaymentFormModal
          bookingId={customer.bookingId}
          customerName={customer.customerName}
          plotNumber={customer.plotNumber}
          balanceDue={summary.balanceDue}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-surface p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        {content}
      </div>
    </div>
  );
}
