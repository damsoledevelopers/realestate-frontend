'use client';

import { useEffect } from 'react';
import {
  getRealtimeSocket,
  joinLayoutRoom,
  leaveLayoutRoom,
  type PlotStatusRealtimeEvent,
} from '@/lib/socket';

interface UseLayoutRealtimeOptions {
  layoutId?: string | null;
  enabled?: boolean;
  onPlotStatus?: (event: PlotStatusRealtimeEvent) => void;
}

export function useLayoutRealtime({
  layoutId,
  enabled = true,
  onPlotStatus,
}: UseLayoutRealtimeOptions) {
  useEffect(() => {
    if (!enabled || !layoutId || !onPlotStatus) return;

    const socket = getRealtimeSocket();
    const handleStatus = (event: PlotStatusRealtimeEvent) => {
      if (!event?.plotId || String(event.layoutId) !== String(layoutId)) return;
      onPlotStatus(event);
    };

    const join = () => joinLayoutRoom(String(layoutId));

    socket.on('connect', join);
    socket.on('plot:status', handleStatus);
    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.off('connect', join);
      socket.off('plot:status', handleStatus);
      leaveLayoutRoom(String(layoutId));
    };
  }, [layoutId, enabled, onPlotStatus]);
}
