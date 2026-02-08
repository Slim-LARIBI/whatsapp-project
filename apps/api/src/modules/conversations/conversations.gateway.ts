import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket gateway for real-time inbox updates.
 * Clients join a room based on their tenant_id.
 */
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/inbox',
})
export class ConversationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
    }
  }

  handleDisconnect(_client: Socket) {
    // cleanup if needed
  }

  /** Emit a new message event to all connected agents of a tenant */
  emitNewMessage(tenantId: string, payload: { conversationId: string; message: unknown }) {
    this.server.to(`tenant:${tenantId}`).emit('message:new', payload);
  }

  /** Emit conversation update (status change, assignment, etc.) */
  emitConversationUpdate(tenantId: string, payload: { conversationId: string; update: unknown }) {
    this.server.to(`tenant:${tenantId}`).emit('conversation:update', payload);
  }

  /** Emit message status update (sent, delivered, read) */
  emitMessageStatus(tenantId: string, payload: { messageId: string; status: string }) {
    this.server.to(`tenant:${tenantId}`).emit('message:status', payload);
  }
}
