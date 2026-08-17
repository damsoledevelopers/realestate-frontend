'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { notify } from '@/lib/notify';
import { getApiErrorMessage } from '@/lib/api';
import { downloadPaymentReceipt, printPaymentReceipt } from '@/lib/downloadReceipt';
import { formatCurrency } from '@/lib/formatLocale';
import {
  fetchPayments,
  PAYMENT_MODE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/payments';
import type { PaymentRecord } from '@/lib/types';
import Pagination from '@/components/ui/Pagination';
import { Download, Printer } from 'lucide-react';

export default function DashboardPaymentsPage() {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPayments(token, { page, limit: 20, status: statusFilter || undefined })
      .then((data) => {
        setPayments(data.payments);
        setPagination(data.pagination);
      })
      .catch((err: unknown) => notify.error(getApiErrorMessage(err, t('payments.loadFailed'))))
      .finally(() => setLoading(false));
  }, [token, page, statusFilter, t]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('payments.pageTitle')}</h2>
          <p className="page-header-subtitle">{t('payments.pageSubtitle')}</p>
        </div>
      </div>

      <div className="card mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-600">{t('payments.filterStatus')}</label>
        <select
          className="input-field max-w-xs"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('payments.allStatuses')}</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">{t('common.loading')}</p>
        ) : payments.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">{t('payments.emptyList')}</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table-data">
                <thead className="border-b text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">{t('payments.receipt')}</th>
                    <th className="px-3 py-3">{t('payments.customer')}</th>
                    <th className="px-3 py-3">{t('payments.property')}</th>
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
                      <td className="px-3 py-3">
                        <p className="font-medium">{payment.customerName}</p>
                        <p className="text-xs text-gray-500">{payment.customerPhone}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <p>{payment.layout?.name || '—'}</p>
                        <p className="text-xs text-gray-500">Plot {payment.plot?.plotNumber || '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {formatCurrency(payment.amount, locale)}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {PAYMENT_MODE_LABELS[payment.paymentMode]}
                      </td>
                      <td className="px-3 py-3 text-sm capitalize">{payment.status}</td>
                      <td className="px-3 py-3">
                        {payment.status === 'success' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => downloadPaymentReceipt(payment)}
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {t('payments.download')}
                            </button>
                            <button
                              type="button"
                              onClick={() => printPaymentReceipt(payment)}
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
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
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
