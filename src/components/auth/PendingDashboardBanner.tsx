'use client';

import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { hasPendingDashboardRequest } from '@/lib/roles';

export default function PendingDashboardBanner() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      setOpen(false);
      return;
    }

    const flagged = sessionStorage.getItem('dashboardAccessPending') === '1';
    const pending = hasPendingDashboardRequest(user.dashboardRequestStatus);

    if (flagged && pending) {
      setOpen(true);
      sessionStorage.removeItem('dashboardAccessPending');
    } else if (flagged && !pending) {
      sessionStorage.removeItem('dashboardAccessPending');
      setOpen(false);
    }
  }, [user, isAuthenticated]);

  if (!open) return null;

  const dismiss = () => setOpen(false);

  return (
    <div className="modal-overlay z-[70]" onClick={dismiss} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-dashboard-title"
        className="modal-panel-md text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock3 className="h-7 w-7" aria-hidden />
        </div>
        <h2 id="pending-dashboard-title" className="mt-4 text-xl font-semibold text-gray-900">
          {t('myBookings.pendingTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {t('statusMessages.pendingDashboard')}
        </p>
        <button type="button" onClick={dismiss} className="btn-primary mt-6 w-full sm:w-auto">
          {t('common.dismiss')}
        </button>
      </div>
    </div>
  );
}
