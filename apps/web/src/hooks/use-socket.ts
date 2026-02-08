'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useSocket(tenantId: string | undefined, handlers: {
  onNewMessage?: (data: { conversationId: string; message: unknown }) => void;
  onConversationUpdate?: (data: { conversationId: string; update: unknown }) => void;
  onMessageStatus?: (data: { messageId: string; status: string }) => void;
}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const socket = io(`${SOCKET_URL}/inbox`, {
      query: { tenantId },
      transports: ['websocket'],
    });

    socket.on('message:new', (data) => handlers.onNewMessage?.(data));
    socket.on('conversation:update', (data) => handlers.onConversationUpdate?.(data));
    socket.on('message:status', (data) => handlers.onMessageStatus?.(data));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [tenantId]);

  return socketRef;
}
