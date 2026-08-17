'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import { NOTIFICATION_TYPE } from '@/constants/css';

export default function NotificationBell({
  variant = 'default',
}: {
  variant?: 'default' | 'dark';
}) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(() => {
    if (!token) return;
    api
      .get<{ count: number }>('/notifications/unread-count', token)
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
  }, [token]);

  const fetchNotifications = useCallback(() => {
    if (!token) return;
    api
      .get<Notification[]>('/notifications/my', token)
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markRead = async (id: string) => {
    if (!token) return;
    await api.patch(`/notifications/${id}/read`, {}, token);
    fetchNotifications();
    fetchUnreadCount();
  };

  const markAllRead = async () => {
    if (!token) return;
    await api.patch('/notifications/read-all', {}, token);
    fetchNotifications();
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={
          variant === 'dark'
            ? 'relative rounded-lg p-2 text-white hover:bg-white/10'
            : 'relative rounded-lg p-2 text-gray-600 hover:bg-gray-100'
        }
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`w-full border-b px-4 py-3 text-left transition hover:bg-gray-50 ${
                    !n.isRead ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${NOTIFICATION_TYPE[n.type]}`}
                    >
                      {n.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{n.message}</p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
