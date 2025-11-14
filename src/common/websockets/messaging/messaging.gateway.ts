import { Injectable } from '@nestjs/common';
import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseGateway } from '../base/base.gateway';
import { WebsocketConnectionService } from '../websocket-connection.service';

interface MessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
  conversationId?: string; // optionnel, si tu gères les conversations
  metadata?: any;
}

@Injectable()
export class MessagingGateway extends BaseGateway {
  constructor(wsConnection: WebsocketConnectionService) {
    super(wsConnection);
  }

  // ===========================================================
  // Événement reçu du front : envoi de message
  // ===========================================================
  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessagePayload,
  ) {
    try {
      this.logger.debug(
        `📨 Message reçu de ${payload.senderId} → ${payload.receiverId}: "${payload.content}"`
      );

      // TODO: Optionnel : sauvegarder le message en DB ici
      // await this.messageService.create(payload);

      // Envoyer le message au destinataire
      this.wsConnection.sendToUser(payload.receiverId, 'newMessage', {
        from: payload.senderId,
        content: payload.content,
        conversationId: payload.conversationId || null,
        metadata: payload.metadata || null,
        timestamp: Date.now(),
      });
      

      // Retour au front (ACK)
      return { status: 'ok', message: 'Message delivered' };
    } catch (error) {
      this.logger.error(`❌ Erreur handleSendMessage: ${error.message}`, error.stack);
      return { status: 'error', message: 'Message not delivered' };
    }
  }

  // ===========================================================
  // Event facultatif pour broadcast à une conversation (room)
  // ===========================================================
  @SubscribeMessage('sendMessageToRoom')
  handleSendMessageToRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; content: string; senderId: string },
  ) {
    try {
      this.logger.debug(`📨 Broadcast message to room ${payload.room}: ${payload.content}`);

      this.wsConnection.sendToRoom(payload.room,'newMessage',{
        from: payload.senderId,
        content: payload.content,
        timestamp: Date.now(),
      })
    } catch (error) {
      this.logger.error(
        `❌ Erreur handleSendMessageToRoom: ${error.message}`,
        error.stack
      );
    }
  }
}
