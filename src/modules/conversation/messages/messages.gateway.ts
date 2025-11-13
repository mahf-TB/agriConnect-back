import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway({ cors: { origin: '*' } }) // ajuster origin pour prod
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients = new Map<string, number>(); // socketId -> userId

  constructor(private readonly messageService: MessagesService) {}

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (userId) {
      this.clients.set(client.id, userId);
      console.log(`[WS] User ${userId} connecté (${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    console.log(`[WS] User déconnecté (${client.id})`);
  }

  /** Envoi d’un message à un user spécifique */
  sendToUser(userId: number, payload: any) {
    for (const [socketId, uid] of this.clients) {
      if (uid === userId) {
        this.server.to(socketId).emit('new_message', payload);
      }
    }
  }

  /** Reçoit un message du client et le stocke */
//   @SubscribeMessage('send_message')
//   async handleSendMessage(client: Socket, data: any) {
//     const message = await this.messageService.create(data);

//     // envoyer au destinataire
//     this.sendToUser(data.destinataireId, message);

//     // mettre à jour dernierMessageId dans la conversation
//     if (data.conversationId) {
//       await this.messageService.updateConversationLastMessage(data.conversationId, message.id);
//     }

//     return message;
//   }
}
