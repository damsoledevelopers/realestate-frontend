'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { Inquiry } from '@/lib/types';
import { notify } from '@/lib/notify';
import { INQUIRY_STATUSES, InquiryStatus } from '@/constants/inquiry';
import InquiryStatusBadge from '@/components/inquiries/InquiryStatusBadge';
import { useLocale } from '@/context/LocaleContext';

export default function AdminInquiriesPage() {
 const { token, user } = useAuth();

const canManageInquiries = ['admin', 'dashboard_admin', 'super_admin'].includes(user?.role || '');
const isSuperAdmin = user?.role === 'super_admin';
  const confirm = useConfirm();
  const { t } = useLocale();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLiveLocationDialog, setShowLiveLocationDialog] = useState(false);
  const [liveDurationHours, setLiveDurationHours] = useState<1 | 2 | 6 | 12 | 24>(1);
  const [liveSession, setLiveSession] = useState<{ token: string; expiresAt: string; durationHours: number } | null>(null);
  const [liveLocationError, setLiveLocationError] = useState('');
  const [liveLocationStarting, setLiveLocationStarting] = useState(false);
  const [liveLocationLastUpdate, setLiveLocationLastUpdate] = useState<string | null>(null);
  const liveWatchId = useState<{ current: number | null }>({ current: null })[0];

  const fetchInquiries = useCallback(() => {
    if (!token || !canManageInquiries) return;
    setLoading(true);
    setLoadError(null);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api
      .get<Inquiry[]>(`/inquiries${query}`, token)
      .then(setInquiries)
      .catch((err) => {
        const message = getApiErrorMessage(err, t('dashboard.inquiries.loadFailed'));
        setLoadError(message);
        notify.error(message);
      })
      .finally(() => setLoading(false));
  }, [token, statusFilter, t, canManageInquiries]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  if (!canManageInquiries) {
    return (
      <div className="dashboard-page">
        <div className="card py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.inquiries.title')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('dashboard.inquiries.superAdminOnly')}</p>
          <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
            {t('dashboard.nav.dashboard')}
          </Link>
        </div>
      </div>
    );
  }

  const counts = useMemo(
    () => ({
      new: inquiries.filter((i) => i.status === 'new').length,
    }),
    [inquiries]
  );

  const updateStatus = async (id: string, status: InquiryStatus, silent = false) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const updated = await api.patch<Inquiry>(`/inquiries/${id}/status`, { status }, token);
      setInquiries((prev) => prev.map((i) => (i._id === id ? updated : i)));
      setSelected((prev) => (prev?._id === id ? updated : prev));
      if (!silent) notify.success(t('dashboard.inquiries.statusUpdated', { status }));
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('dashboard.inquiries.statusUpdateFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!token || !isSuperAdmin) return;
    const confirmed = await confirm({
      title: t('dashboard.inquiries.deleteTitle'),
      message: t('dashboard.inquiries.deleteMessage'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/inquiries/${id}`, token);
      setInquiries((prev) => prev.filter((i) => i._id !== id));
      setSelected(null);
      notify.success(t('dashboard.inquiries.deleteSuccess'));
    } catch (err: unknown) {
      notify.error(getApiErrorMessage(err, t('dashboard.inquiries.deleteFailed')));
    }
  };

  const openInquiry = (inquiry: Inquiry) => {
    setSelected(inquiry);
    if (inquiry.status === 'new') {
      updateStatus(inquiry._id, 'read', true);
    }
  };

  const replyMailto = (inquiry: Inquiry) => {
    const subject = encodeURIComponent(`Re: ${inquiry.subject}`);
    const body = encodeURIComponent(
      t('dashboard.inquiries.replyMailGreeting', { name: inquiry.name, subject: inquiry.subject })
    );
    window.location.href = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
    if (inquiry.status !== 'replied') {
      updateStatus(inquiry._id, 'replied');
    }
  };

  const replyWhatsApp = (inquiry: Inquiry) => {
    const phone = (inquiry.phone || '').replace(/[^0-9]/g, '');
    if (!phone) { notify.warning(t('dashboard.inquiries.noPhoneWhatsApp')); return; }
    const coords = inquiry.layoutCoordinates;
    const mapLink = coords?.lat != null && coords?.lng != null
      ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : inquiry.layoutLocation ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inquiry.layoutLocation)}` : '';
    const message = [
      t('dashboard.inquiries.whatsappGreeting', { name: inquiry.name }),
      inquiry.layoutName ? t('dashboard.inquiries.layoutLabel', { name: inquiry.layoutName }) : '',
      inquiry.plotNumber ? t('dashboard.inquiries.plotLabel', { number: inquiry.plotNumber }) : '',
      inquiry.surveyNumber ? t('dashboard.inquiries.surveyLabel', { number: inquiry.surveyNumber }) : '',
      inquiry.layoutLocation ? t('dashboard.inquiries.locationLabel', { location: inquiry.layoutLocation }) : '',
      mapLink ? `Google Maps: ${mapLink}` : '',
      t('dashboard.inquiries.enquiryLabel', { message: inquiry.message }),
      t('dashboard.inquiries.whatsappFollowup')
    ].filter(Boolean).join('\n');
    const normalizedPhone = phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  // Live location is streamed from this Admin browser to a time-limited server session.
  // WhatsApp only distributes the recipient link; it does not provide the GPS tracking itself.
  const stopBrowserLocationWatch = () => {
    if (liveWatchId.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveWatchId.current);
      liveWatchId.current = null;
    }
  };

  const shareMapWhatsApp = (inquiry: Inquiry) => {
    if (!(inquiry.phone || '').replace(/[^0-9]/g, '')) {
      notify.warning(t('dashboard.inquiries.noPhoneWhatsApp'));
      return;
    }
    // Keep the Super Admin's existing static-map behavior unchanged; live sharing
    // is intentionally available only to the Admin inquiry workflow.
    if (user?.role !== 'admin') {
      const coords = inquiry.layoutCoordinates;
      const searchQuery = inquiry.layoutLocation || inquiry.layoutName || inquiry.subject;
      const mapLink = coords?.lat != null && coords?.lng != null
        ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery || 'real estate layout')}`;
      const phone = (inquiry.phone || '').replace(/[^0-9]/g, '');
      const normalizedPhone = phone.length === 10 ? `91${phone}` : phone;
      const message = [t('dashboard.inquiries.mapShareGreeting', { name: inquiry.name }), inquiry.layoutName ? t('dashboard.inquiries.layoutLabel', { name: inquiry.layoutName }) : '', inquiry.plotNumber ? t('dashboard.inquiries.plotLabel', { number: inquiry.plotNumber }) : '', inquiry.layoutLocation ? t('dashboard.inquiries.locationLabel', { location: inquiry.layoutLocation }) : '', mapLink].filter(Boolean).join('\n');
      window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    setLiveLocationError('');
    setShowLiveLocationDialog(true);
  };

  const stopLiveLocation = async () => {
    if (!liveSession || !token) return;
    stopBrowserLocationWatch();
    try {
      await api.post(`/inquiries/live-location/${liveSession.token}/stop`, {}, token);
      setLiveSession(null);
      setLiveLocationLastUpdate(null);
      notify.success(t('dashboard.inquiries.liveStopped'));
    } catch (err) {
      notify.error(getApiErrorMessage(err, t('dashboard.inquiries.stopLiveFailed')));
    }
  };

  const startLiveLocation = async () => {
    if (!selected || !token) return;
    if (!navigator.geolocation) {
      setLiveLocationError(t('dashboard.inquiries.liveUnsupportedGps'));
      return;
    }
    if (!window.isSecureContext) {
      setLiveLocationError(t('dashboard.inquiries.httpsRequired'));
      return;
    }
    const phone = (selected.phone || '').replace(/[^0-9]/g, '');
    if (!phone) {
      setLiveLocationError(t('dashboard.inquiries.invalidPhone'));
      return;
    }
    setLiveLocationStarting(true);
    setLiveLocationError('');
    // Open a temporary tab synchronously from the click to avoid popup blockers.
    // It is redirected to WhatsApp only after GPS and the public URL are validated.
    const whatsappTab = window.open('about:blank', '_blank');
    try {
      const initialPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
        });
      });
      const session = await api.post<{ token: string; expiresAt: string; durationHours: number; shareUrl: string }>(
        '/inquiries/live-location',
        {
          inquiryId: selected._id,
          durationHours: liveDurationHours,
          recipientName: selected.name,
          layoutName: selected.layoutName || '',
          plotNumber: selected.plotNumber || '',
        },
        token
      );
      const shareUrl = typeof session.shareUrl === 'string' ? new URL(session.shareUrl) : null;
      const isLocalTrackingHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(shareUrl?.hostname || '');
      const isLocalDevelopment = process.env.NODE_ENV !== 'production';
      if (!shareUrl || !['https:', 'http:'].includes(shareUrl.protocol) || (isLocalTrackingHost && !isLocalDevelopment) || (process.env.NODE_ENV === 'production' && shareUrl.protocol !== 'https:')) {
        throw new Error(t('dashboard.inquiries.publicUrlMissing'));
      }
      // Persist a real GPS fix before sharing so the recipient never receives an
      // empty or subject-derived map location.
      await api.patch(`/inquiries/live-location/${session.token}`, {
        latitude: initialPosition.coords.latitude,
        longitude: initialPosition.coords.longitude,
        accuracy: initialPosition.coords.accuracy,
      }, token);
      setLiveSession(session);
      setLiveLocationLastUpdate(new Date().toISOString());
      setShowLiveLocationDialog(false);
      const normalizedPhone = phone.length === 10 ? `91${phone}` : phone;
      const message = [
        t('dashboard.inquiries.liveShareGreeting', { name: selected.name, hours: session.durationHours }),
        selected.layoutName ? `Layout: ${selected.layoutName}` : '',
        selected.plotNumber ? `Plot: ${selected.plotNumber}` : '',
        t('dashboard.inquiries.liveLinkExpires', { date: new Date(session.expiresAt).toLocaleString(), url: shareUrl.href }),
        `Latest GPS on Google Maps: https://www.google.com/maps?q=${initialPosition.coords.latitude},${initialPosition.coords.longitude}`,
        t('dashboard.inquiries.liveLinkInstructions'),
      ].filter(Boolean).join('\n');
      const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
      if (whatsappTab && !whatsappTab.closed) whatsappTab.location.replace(whatsappUrl);
      else window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            await api.patch(`/inquiries/live-location/${session.token}`, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }, token);
            setLiveLocationLastUpdate(new Date().toISOString());
          } catch (err) {
            setLiveLocationError(getApiErrorMessage(err, t('dashboard.inquiries.gpsUpdateFailed')));
            stopBrowserLocationWatch();
          }
        },
        (gpsError) => {
          const reason = gpsError.code === gpsError.PERMISSION_DENIED
            ? t('dashboard.inquiries.gpsPermissionDeniedShort')
            : gpsError.code === gpsError.POSITION_UNAVAILABLE
              ? t('dashboard.inquiries.gpsPositionUnavailable')
              : t('dashboard.inquiries.gpsWatchTimeout');
          setLiveLocationError(reason);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
      );
      liveWatchId.current = watchId;
      const remaining = Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
      window.setTimeout(() => {
        stopBrowserLocationWatch();
        setLiveSession((current) => current?.token === session.token ? null : current);
        setLiveLocationLastUpdate(null);
        setLiveLocationError(t('dashboard.inquiries.liveExpired'));
      }, remaining);
    } catch (err) {
      if (whatsappTab && !whatsappTab.closed) whatsappTab.close();
      // Geolocation permission errors are browser errors, not API errors. Give
      // the Admin actionable instructions; the site cannot grant permission itself.
      const gpsError = err as GeolocationPositionError;
      const isGeoError = typeof gpsError?.code === 'number';
      const message = isGeoError && gpsError.code === 1
        ? t('dashboard.inquiries.gpsPermissionDenied')
        : isGeoError && gpsError.code === 2
          ? t('dashboard.inquiries.gpsUnavailable')
          : isGeoError && gpsError.code === 3
            ? t('dashboard.inquiries.gpsTimeout')
            : getApiErrorMessage(err, t('dashboard.inquiries.liveStartFailed'));
      setLiveLocationError(message);
    } finally {
      setLiveLocationStarting(false);
    }
  };

  useEffect(() => () => {
    if (liveWatchId.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveWatchId.current);
    }
  }, [liveWatchId]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2 className="page-header-title">{t('dashboard.inquiries.title')}</h2>
          <p className="page-header-subtitle">
            {t('dashboard.inquiries.subtitle')}
            {!statusFilter && counts.new > 0 && (
              <span className="ml-2 font-medium text-blue-600">
                {t('dashboard.inquiries.newCount', { count: String(counts.new) })}
              </span>
            )}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-auto sm:min-w-[140px]"
        >
          <option value="">{t('dashboard.inquiries.allStatuses')}</option>
          {INQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`dashboard.inquiries.status.${status}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-500">{loadError}</p>
            <button type="button" onClick={fetchInquiries} className="btn-primary mt-4">
              {t('common.retry')}
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <p className="text-sm text-gray-400">{t('dashboard.inquiries.empty')}</p>
        ) : (
          <div className="table-wrap">
            <table className="table-data">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colName')}</th>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colSubject')}</th>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colDate')}</th>
                  <th className="px-4 py-3">{t('dashboard.inquiries.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inquiries.map((inq) => (
                  <tr
                    key={inq._id}
                    onClick={() => openInquiry(inq)}
                    className={`cursor-pointer transition hover:bg-gray-50 ${
                      inq.status === 'new' ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{inq.name}</p>
                      <p className="text-xs text-gray-500">{inq.email}</p>
                    </td>
                    <td className="px-4 py-3">{inq.subject}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <InquiryStatusBadge status={inq.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.email}</p>
                {selected.phone && <p className="text-sm text-gray-500">{selected.phone}</p>}
              </div>
              <InquiryStatusBadge status={selected.status} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">{t('dashboard.inquiries.subject')}</dt>
                <dd className="font-medium">{selected.subject}</dd>
              </div>
              {(selected.layoutName || selected.layoutLocation || selected.plotNumber || selected.surveyNumber) && (
                <div className="rounded-lg border border-gray-200 p-3">
                  <dt className="text-gray-500">{t('dashboard.inquiries.layoutPlotDetails')}</dt>
                  {selected.layoutName && <dd className="font-medium">{selected.layoutName}</dd>}
                  {selected.plotNumber && <dd>{t('dashboard.inquiries.plotLabel', { number: selected.plotNumber })}</dd>}
                  {selected.surveyNumber && <dd>{t('dashboard.inquiries.surveyLabel', { number: selected.surveyNumber })}</dd>}
                  {selected.layoutLocation && <dd className="text-gray-600">{selected.layoutLocation}</dd>}
                  {selected.layoutCoordinates?.lat != null && selected.layoutCoordinates?.lng != null ? (
                    <dd><a className="text-primary-700 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${selected.layoutCoordinates.lat},${selected.layoutCoordinates.lng}`}>{t('dashboard.inquiries.openGoogleMaps')}</a></dd>
                  ) : selected.layoutLocation ? (
                    <dd><a className="text-primary-700 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.layoutLocation)}`}>{t('dashboard.inquiries.searchGoogleMaps')}</a></dd>
                  ) : null}
                </div>
              )}
              <div>
                <dt className="text-gray-500">{t('dashboard.inquiries.received')}</dt>
                <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('dashboard.inquiries.message')}</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700">
                  {selected.message}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => replyWhatsApp(selected)} disabled={!selected.phone || actionLoading} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">{t('dashboard.inquiries.replyWhatsApp')}</button>
              <button
                type="button"
                onClick={() => shareMapWhatsApp(selected)}
                disabled={!selected.phone || actionLoading}
                title={t('dashboard.inquiries.shareMapWhatsApp')}
                className="inline-flex items-center gap-2 rounded-xl border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                  <circle cx="12" cy="9" r="2.2" />
                </svg>
                {t('dashboard.inquiries.shareMapWhatsApp')}
              </button>
              <button
                type="button"
                onClick={() => replyMailto(selected)}
                disabled={actionLoading}
                className="btn-primary text-sm"
              >
                {t('dashboard.inquiries.replyEmail')}
              </button>
              {selected.status !== 'read' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected._id, 'read')}
                  disabled={actionLoading}
                  className="btn-secondary text-sm"
                >
                  {t('dashboard.inquiries.markRead')}
                </button>
              )}
              {selected.status !== 'replied' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected._id, 'replied')}
                  disabled={actionLoading}
                  className="btn-secondary text-sm"
                >
                  {t('dashboard.inquiries.markReplied')}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(selected._id)}
                className="btn-danger text-sm"
              >
                {t('common.delete')}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-secondary ml-auto text-sm"
              >
                {t('common.close')}
              </button>
            </div>
            {user?.role === 'admin' && liveSession && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                <p className="font-semibold">{t('dashboard.inquiries.liveActive')}</p>
                <p>{t('dashboard.inquiries.expires', { date: new Date(liveSession.expiresAt).toLocaleString() })}</p>
                <p>{liveLocationLastUpdate ? t('dashboard.inquiries.lastGpsUpdate', { date: new Date(liveLocationLastUpdate).toLocaleTimeString() }) : t('dashboard.inquiries.waitingGps')}</p>
                {liveLocationError && <p className="mt-1 text-red-700">{liveLocationError}</p>}
                <button type="button" onClick={stopLiveLocation} className="mt-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700">{t('dashboard.inquiries.stopSharing')}</button>
              </div>
            )}
          </div>
        </div>
      )}
      {user?.role === 'admin' && showLiveLocationDialog && selected && (
        <div className="modal-overlay z-[70]" role="dialog" aria-modal="true" aria-labelledby="live-location-title">
          <div className="modal-panel max-w-md">
            <h3 id="live-location-title" className="text-lg font-semibold">{t('dashboard.inquiries.liveTitle')}</h3>
            <p className="mt-1 text-sm text-gray-600">{t('dashboard.inquiries.liveDurationHint')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[1, 2, 6, 12, 24].map((hours) => (
                <button key={hours} type="button" onClick={() => setLiveDurationHours(hours as 1 | 2 | 6 | 12 | 24)} aria-pressed={liveDurationHours === hours}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${liveDurationHours === hours ? 'border-green-600 bg-green-50 text-green-800 ring-2 ring-green-200' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
                  {hours} {hours === 1 ? t('dashboard.inquiries.durationHour') : t('dashboard.inquiries.durationHours')}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">{t('dashboard.inquiries.liveDescription')}</p>
            <p className="mt-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">{t('dashboard.inquiries.gpsPermissionHelp')}</p>
            {liveLocationError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{liveLocationError}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => { setShowLiveLocationDialog(false); setLiveLocationError(''); }} className="btn-secondary text-sm">{t('dashboard.inquiries.cancel')}</button>
              <button type="button" onClick={startLiveLocation} disabled={liveLocationStarting} className="inline-flex items-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                {liveLocationStarting ? t('dashboard.inquiries.starting') : t('dashboard.inquiries.startShareWhatsApp')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
