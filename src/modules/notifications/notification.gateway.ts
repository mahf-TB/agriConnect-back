import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients = new Map<string, string>(); // socketId -> userId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.clients.set(client.id, userId);
      console.log(`✅ Notification: User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
  }

  sendToUser(userId: string, data: any) {
    for (const [socketId, uid] of this.clients) {
      if (uid === userId) this.server.to(socketId).emit('notification', data);
      console.log(socketId);
      
    }
  }

  broadcast(data: any) {
    this.server.emit('notification', data);
  }
}
