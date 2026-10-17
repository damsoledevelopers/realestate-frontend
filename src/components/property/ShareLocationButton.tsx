'use client';

import { useEffect, useRef, useState } from 'react';
import { getGoogleMapsExternalUrl, hasValidCoordinates } from '@/lib/googleMaps';
import { notify } from '@/lib/notify';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';

interface ShareLocationButtonProps {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  className?: string;
  fullWidth?: boolean;
  assetId?: string;
  assetType?: 'layout' | 'farm' | 'plot' | 'land';
}

type LiveSession = { token: string; expiresAt: string; durationHours: number; shareUrl: string };
const DURATIONS = [1, 2, 6, 12, 24] as const;

export default function ShareLocationButton({
  latitude, longitude, title = 'Property Location', className = '', fullWidth = true,
  assetId, assetType = 'layout',
}: ShareLocationButtonProps) {
  const { t } = useLocale();
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [liveDialog, setLiveDialog] = useState(false);
  const [duration, setDuration] = useState<number>(2);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const watchRef = useRef<number | null>(null);
  const expiryRef = useRef<number | null>(null);
  const mapsUrl = getGoogleMapsExternalUrl(latitude, longitude);
  const hasCoords = hasValidCoordinates(latitude, longitude);

  const stopWatch = () => {
    if (watchRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (expiryRef.current !== null) { window.clearTimeout(expiryRef.current); expiryRef.current = null; }
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => () => stopWatch(), []);

  const copyLink = async () => {
    if (!mapsUrl) return;
    try { await navigator.clipboard.writeText(mapsUrl); notify.success(t('property.linkCopied')); setOpen(false); }
    catch { notify.error(t('property.couldNotCopy')); }
  };
  const shareWhatsApp = () => {
    if (!mapsUrl) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${mapsUrl}`)}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };
  const shareEmail = () => {
    if (!mapsUrl) return;
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${mapsUrl}`)}`;
    setOpen(false);
  };
  const shareNative = async () => {
    if (!mapsUrl || !navigator.share) return;
    try { await navigator.share({ title, text: title, url: mapsUrl }); setOpen(false); } catch { /* user cancelled */ }
  };

  const startLiveShare = async () => {
    if (!token) { setError('Please sign in to share live location.'); return; }
    if (!assetId) { setError('This asset is missing its database ID, so live sharing cannot start.'); return; }
    if (!navigator.geolocation) { setError('This browser does not support GPS location.'); return; }
    if (!window.isSecureContext) { setError('Live GPS sharing requires the deployed HTTPS website.'); return; }
    setStarting(true); setError('');
    const whatsappTab = window.open('about:blank', '_blank');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }));
      const session = await api.post<LiveSession>('/inquiries/live-location', {
        durationHours: duration, recipientName: '', layoutName: title, plotNumber: '', assetType, assetId,
      }, token);
      const shareUrl = new URL(session.shareUrl);
      if (!['https:', 'http:'].includes(shareUrl.protocol) || /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(shareUrl.hostname)) throw new Error('The backend must be configured with the deployed public HTTPS frontend URL.');
      await api.patch(`/inquiries/live-location/${session.token}`, { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }, token);
      setActiveSession(session);
      setLiveDialog(false); setOpen(false);
      const message = `${title} — live GPS location for ${session.durationHours} hour(s). Expires: ${new Date(session.expiresAt).toLocaleString()}. View latest location: ${shareUrl.href}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      if (whatsappTab && !whatsappTab.closed) whatsappTab.location.replace(whatsappUrl);
      else window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      watchRef.current = navigator.geolocation.watchPosition(async (next) => {
        try { await api.patch(`/inquiries/live-location/${session.token}`, { latitude: next.coords.latitude, longitude: next.coords.longitude, accuracy: next.coords.accuracy }, token); }
        catch (err) { setError(getApiErrorMessage(err, 'GPS updates stopped. The session may have expired.')); stopWatch(); }
      }, (gpsError) => setError(gpsError.code === 1 ? 'Location permission denied. GPS updates have stopped.' : 'GPS position unavailable. Check device location settings.'), { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
      expiryRef.current = window.setTimeout(() => { stopWatch(); setActiveSession(null); notify.success('Live location sharing expired.'); }, Math.max(0, new Date(session.expiresAt).getTime() - Date.now()));
    } catch (err) {
      if (whatsappTab && !whatsappTab.closed) whatsappTab.close();
      const gps = err as GeolocationPositionError;
      setError(typeof gps?.code === 'number' && gps.code === 1 ? 'Location permission denied. Allow Location in your browser site settings and try again.' : getApiErrorMessage(err, 'Live location could not start. Check GPS permission and PUBLIC_FRONTEND_URL.'));
    } finally { setStarting(false); }
  };

  const stopLiveShare = async () => {
    if (!activeSession || !token) return;
    stopWatch();
    try { await api.post(`/inquiries/live-location/${activeSession.token}/stop`, {}, token); setActiveSession(null); notify.success('Live location sharing stopped.'); }
    catch (err) { setError(getApiErrorMessage(err, 'Could not stop live location on the server.')); }
  };

  const widthClass = fullWidth ? 'w-full' : '';
  if (!hasCoords || !mapsUrl) return <button type="button" disabled className={`btn-secondary cursor-not-allowed opacity-60 ${widthClass} ${className}`}>{t('property.shareLocation')}</button>;

  return (
    <div className={`relative ${widthClass} ${className}`} ref={menuRef}>
      <button type="button" onClick={() => setOpen((current) => !current)} className={`btn-secondary inline-flex items-center justify-center gap-2 ${widthClass}`} aria-expanded={open} aria-haspopup="menu"><ShareIcon />{t('property.shareLocation')}</button>
      {open && <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2" role="menu">
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && <ShareMenuItem onClick={shareNative} label={t('property.shareViaDevice')} />}
        <ShareMenuItem onClick={shareWhatsApp} label="WhatsApp (static map)" />
        <ShareMenuItem onClick={() => { setError(''); setLiveDialog(true); setOpen(false); }} label="WhatsApp — live location (1–24 hours)" />
        <ShareMenuItem onClick={shareEmail} label={t('contact.email')} />
        <ShareMenuItem onClick={copyLink} label={t('property.copyLink')} />
      </div>}
      {activeSession && <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900"><p className="font-semibold">Live location sharing active</p><p>Expires: {new Date(activeSession.expiresAt).toLocaleString()}</p><button type="button" onClick={() => void stopLiveShare()} className="mt-2 rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white">Stop sharing</button></div>}
      {liveDialog && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="layout-live-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h3 id="layout-live-title" className="text-lg font-semibold text-gray-900">Share Live Location</h3><p className="mt-2 text-sm text-gray-600">Choose how long your current GPS position can be viewed. Keep this page open while sharing.</p><div className="mt-4 grid grid-cols-3 gap-2">{DURATIONS.map((hours) => <button key={hours} type="button" onClick={() => setDuration(hours)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${duration === hours ? 'border-green-500 bg-green-50 text-green-800 ring-2 ring-green-200' : 'border-gray-200 text-gray-700'}`}>{hours} {hours === 1 ? 'hour' : 'hours'}</button>)}</div><p className="mt-3 text-xs text-gray-500">This sends one WhatsApp message with a secure tracking link. It is not WhatsApp’s built-in live-location feature. GPS requires browser permission and HTTPS.</p>{error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setLiveDialog(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button><button type="button" disabled={starting} onClick={() => void startLiveShare()} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{starting ? 'Starting…' : 'Start & Share on WhatsApp'}</button></div></div></div>}
    </div>
  );
}

function ShareMenuItem({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" role="menuitem" onClick={onClick} className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">{label}</button>; }
function ShareIcon() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>; }
