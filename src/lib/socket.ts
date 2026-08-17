import { io, Socket } from 'socket.io-client';
import { getApiOrigin } from '@/lib/apiBase';
import { getStoredAuth } from '@/lib/auth-storage';

export interface PlotStatusRealtimeEvent {
  layoutId: string;
  plotId: string;
  status: string;
  plotNumber?: string | null;
  constructionStatus?: string | null;
  bookingId?: string | null;
  reason?: string;
  updatedAt?: string;
}

let socket: Socket | null = null;

export function getRealtimeSocket(): Socket {
  if (socket) return socket;

  const { token } = getStoredAuth();

  socket = io(getApiOrigin(), {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    withCredentials: true,
    auth: token ? { token } : {},
  });

  return socket;
}

export function disconnectRealtimeSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function joinLayoutRoom(layoutId: string) {
  if (!layoutId) return;
  const client = getRealtimeSocket();
  client.emit('layout:join', layoutId);
}

export function leaveLayoutRoom(layoutId: string) {
  if (!layoutId || !socket) return;
  socket.emit('layout:leave', layoutId);
}
