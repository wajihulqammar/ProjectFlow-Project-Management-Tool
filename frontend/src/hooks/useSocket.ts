'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

export function useSocket() {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
    }

    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount of individual components
    };
  }, [token]);

  return socketRef.current;
}

export function getSocket() {
  return socket;
}

export function joinProject(projectId: string) {
  socket?.emit('project:join', projectId);
}

export function leaveProject(projectId: string) {
  socket?.emit('project:leave', projectId);
}

export function emitTaskUpdate(data: any) {
  socket?.emit('task:update', data);
}
