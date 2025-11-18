import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketConnectionService {
  private readonly logger = new Logger(WebsocketConnectionService.name);

  private io: Server | null = null;

  // socketId → userId
  private readonly socketToUser = new Map<string, string>();
  // userId → Set<socketId>
  private readonly userToSockets = new Map<string, Set<string>>();

  setServer(server: Server) {
    this.io = server;
    this.logger.log('Websocket server initialisé');
  }

  register(socketId: string, userId: string) {
    this.socketToUser.set(socketId, userId);

    if (!this.userToSockets.has(userId)) {
      this.userToSockets.set(userId, new Set());
    }

    this.userToSockets.get(userId)!.add(socketId);
    this.logger.debug(`User ${userId} connected with socket ${socketId}`);
  }

  unregister(socketId: string) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return;

    this.socketToUser.delete(socketId);

    const sockets = this.userToSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userToSockets.delete(userId);
    }

    this.logger.debug(`User ${userId} disconnected socket ${socketId}`);
  }

  getSocketsForUser(userId: string): string[] {
    return Array.from(this.userToSockets.get(userId) ?? []);
  }

  getUserForSocket(socketId: string): string | undefined {
    return this.socketToUser.get(socketId);
  }

  getTotalConnections(): number {
    return this.socketToUser.size;
  }

  getUniqueUsersCount(): number {
    return this.userToSockets.size;
  }

  // ---- LOW-LEVEL SEND WRAPPERS ---- //

  sendToUser(userId: string, event: string, payload: any) {
    if (!this.io) return;

    const sockets = this.userToSockets.get(userId);
    if (!sockets) return;

    sockets.forEach((sid) => this.io!.to(sid).emit(event, payload));
  }

  sendToUsers(userIds: string[], event: string, payload: any) {
    if (!this.io) return;

    for (const userId of userIds) {
      const sockets = this.userToSockets.get(userId);
      if (!sockets) continue;
      sockets.forEach((sid) => this.io!.to(sid).emit(event, payload));
    }
  }

  sendToRoom(room: string, event: string, payload: any) {
    this.io?.to(room).emit(event, payload);
  }

  broadcast(event: string, payload: any) {
    this.io?.emit(event, payload);
  }
}
