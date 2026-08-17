'use client';

import { LoginHistoryEntry } from '@/lib/types';
import { useLocale } from '@/context/LocaleContext';
import ResponsiveTable, { MobileDataCard, MobileDataRow } from '@/components/ui/ResponsiveTable';

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function StatusBadge({
  status,
  successLabel,
  failedLabel,
}: {
  status: LoginHistoryEntry['loginStatus'];
  successLabel: string;
  failedLabel: string;
}) {
  const isSuccess = status === 'success';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isSuccess ? successLabel : failedLabel}
    </span>
  );
}

interface LoginHistoryTableProps {
  entries: LoginHistoryEntry[];
}

export default function LoginHistoryTable({ entries }: LoginHistoryTableProps) {
  const { t } = useLocale();

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">{t('dashboard.loginHistory.empty')}</p>;
  }

  return (
    <ResponsiveTable
      mobile={entries.map((entry) => (
        <MobileDataCard key={entry.id}>
          <div className="mb-3 border-b border-gray-100 pb-3">
            <p className="font-medium text-gray-900">{entry.userName || entry.username}</p>
            <p className="text-xs text-gray-500">{entry.userEmail || entry.username}</p>
            {entry.loginStatus === 'failed' && entry.failureReason && (
              <p className="mt-1 text-xs text-red-600">{entry.failureReason}</p>
            )}
          </div>
          <MobileDataRow label={t('dashboard.loginHistory.colLoginTime')}>
            {formatDateTime(entry.loginTime)}
          </MobileDataRow>
          <MobileDataRow label={t('dashboard.loginHistory.colLogoutTime')}>
            {formatDateTime(entry.logoutTime)}
          </MobileDataRow>
          <MobileDataRow label={t('dashboard.loginHistory.colDuration')}>
            {entry.sessionDurationFormatted || '—'}
          </MobileDataRow>
          <MobileDataRow label={t('dashboard.loginHistory.colStatus')}>
            <StatusBadge
              status={entry.loginStatus}
              successLabel={t('dashboard.loginHistory.statusSuccess')}
              failedLabel={t('dashboard.loginHistory.statusFailed')}
            />
          </MobileDataRow>
          <MobileDataRow label={t('dashboard.loginHistory.colIp')}>
            {entry.ipAddress || '—'}
          </MobileDataRow>
          <MobileDataRow label={t('dashboard.loginHistory.colBrowser')}>
            {entry.browser || '—'}
          </MobileDataRow>
          <MobileDataRow label={t('dashboard.loginHistory.colDevice')}>
            {entry.device || '—'}
          </MobileDataRow>
        </MobileDataCard>
      ))}
    >
      <thead className="border-b text-xs uppercase text-gray-500">
        <tr>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colUser')}</th>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colLoginTime')}</th>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colLogoutTime')}</th>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colDuration')}</th>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colStatus')}</th>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colIp')}</th>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colBrowser')}</th>
          <th className="px-4 py-3">{t('dashboard.loginHistory.colDevice')}</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {entries.map((entry) => (
          <tr key={entry.id} className="bg-white">
            <td className="px-4 py-3">
              <div>
                <p className="font-medium">{entry.userName || entry.username}</p>
                <p className="text-xs text-gray-500">{entry.userEmail || entry.username}</p>
                {entry.loginStatus === 'failed' && entry.failureReason && (
                  <p className="mt-1 text-xs text-red-600">{entry.failureReason}</p>
                )}
              </div>
            </td>
            <td className="px-4 py-3 text-gray-600">{formatDateTime(entry.loginTime)}</td>
            <td className="px-4 py-3 text-gray-600">{formatDateTime(entry.logoutTime)}</td>
            <td className="px-4 py-3 text-gray-600">{entry.sessionDurationFormatted || '—'}</td>
            <td className="px-4 py-3">
              <StatusBadge
                status={entry.loginStatus}
                successLabel={t('dashboard.loginHistory.statusSuccess')}
                failedLabel={t('dashboard.loginHistory.statusFailed')}
              />
            </td>
            <td className="px-4 py-3 text-gray-500">{entry.ipAddress || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{entry.browser || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{entry.device || '—'}</td>
          </tr>
        ))}
      </tbody>
    </ResponsiveTable>
  );
}
