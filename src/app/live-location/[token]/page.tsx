'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';

type LiveLocation = {
  active: boolean;
  expired: boolean;
  stopped: boolean;
  recipientName: string;
  layoutName: string;
  plotNumber: string;
  durationHours: number;
  expiresAt: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  locationUpdatedAt: string | null;
};

export default function LiveLocationPage() {
  const params = useParams<{ token: string }>();
  const sessionToken = Array.isArray(params.token) ? params.token[0] : params.token;
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const result = await api.get<LiveLocation>(`/inquiries/live-location/${encodeURIComponent(sessionToken)}`);
      setLocation(result);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'This live-location link is not available.'));
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const hasCoordinates = location?.latitude != null && location?.longitude != null;
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : '';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Live Location</h1>
            <p className="mt-1 text-sm text-gray-500">This page refreshes the latest shared GPS position automatically.</p>
          </div>
        </div>

        {loading ? <p className="mt-6 text-sm text-gray-500">Loading live location…</p> : null}
        {error ? <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {location && (
          <>
            <div className={`mt-6 rounded-xl p-4 text-sm ${location.active ? 'bg-green-50 text-green-900' : 'bg-gray-100 text-gray-700'}`}>
              <p className="font-semibold">{location.active ? 'Sharing is active' : location.stopped ? 'Sharing was stopped by the Admin' : 'This live-location session has expired'}</p>
              {location.layoutName && <p className="mt-1">Layout: {location.layoutName}</p>}
              {location.plotNumber && <p>Plot: {location.plotNumber}</p>}
              <p className="mt-1">Scheduled expiry: {new Date(location.expiresAt).toLocaleString()}</p>
            </div>
            {hasCoordinates ? (
              <div className="mt-5">
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <iframe title="Latest live GPS position" src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=16&output=embed`} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                  <span>{location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}</span>
                  {mapUrl && <a className="font-semibold text-green-700 underline" href={mapUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>}
                </div>
                {location.accuracy != null && <p className="mt-1 text-xs text-gray-500">GPS accuracy: approximately {Math.round(location.accuracy)} m</p>}
                <p className="mt-2 text-xs text-gray-500">Last update: {location.locationUpdatedAt ? new Date(location.locationUpdatedAt).toLocaleString() : 'Waiting for the Admin’s first GPS fix…'}</p>
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-600">Waiting for the Admin’s first GPS position. Keep this page open; it checks for updates every 5 seconds.</p>
            )}
            {location.active && <p className="mt-4 text-xs text-gray-500">For privacy, this link stops updating when the selected duration ends or the Admin stops sharing. GPS updates depend on the Admin’s browser, device permissions, and network connection.</p>}
          </>
        )}
        <button type="button" onClick={() => void refresh()} className="mt-6 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Refresh now</button>
      </div>
    </main>
  );
}
