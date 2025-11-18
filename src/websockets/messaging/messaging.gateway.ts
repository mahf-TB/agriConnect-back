import { Injectable } from '@nestjs/common';
import {
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseGateway } from '../base/base.gateway';
import { WebsocketConnectionService } from '../websocket-connection.service';
import { Message } from 'generated/client';

@Injectable()
export class MessagingGateway extends BaseGateway {
  constructor(wsConnection: WebsocketConnectionService) {
    super(wsConnection);
  }

  /**
   * Envoyer une notification (API interne pour d’autres modules)
   */
  sendMessageToUser(conversationId: string, payload: Message) {
    this.wsConnection.sendToRoom(conversationId, 'message:created', {
      ...payload,
      timestamp: Date.now(),
    });
  }

  sendMessageUpdateToUser(conversationId: string, payload: any) {
    this.wsConnection.sendToRoom(conversationId, 'message:updated', {
      ...payload,
      timestamp: Date.now(),
    });
  }

  sendMessageReadToUser(conversationId: string, payload: any) {
    this.wsConnection.sendToRoom(conversationId, 'message:readed', {
      ...payload,
      timestamp: Date.now(),
    });
  }

  // ===========================================================
  // Événement reçu du front : envoi de message
  // ===========================================================

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; userId?: string },
  ) {
    try {
      const room = payload.conversationId;
      client.join(room);
      const userId = payload.userId || client.id;
      this.logger.debug(`➡️ Client ${userId} joined conversation ${room}`);
      return { status: 'ok', message: `Joined ${room}` };
    } catch (error) {
      this.logger.error(
        `❌ Erreur handleJoinConversation: ${error.message}`,
        error.stack,
      );
      return { status: 'error', message: 'Could not join conversation' };
    }
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; userId?: string },
  ) {
    try {
      const room = payload.conversationId;
      client.leave(room);
      const userId = payload.userId || client.id;
      this.logger.debug(`⬅️ Client ${userId} left conversation ${room}`);

      // Optionnel : prévenir les autres membres de la salle
      // this.wsConnection.sendToRoom(room, 'participantLeft', {
      //   userId,
      //   timestamp: Date.now(),
      // });

      return { status: 'ok', message: `Left ${room}` };
    } catch (error) {
      this.logger.error(
        `❌ Erreur handleLeaveConversation: ${error.message}`,
        error.stack,
      );
      return { status: 'error', message: 'Could not leave conversation' };
    }
  }

  // @SubscribeMessage('message:read')
  // async handleMessageRead(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody()
  //   payload: {
  //     conversationId: string;
  //     readerId: string;
  //   },
  // ) {
  //   try {
  //     const { conversationId, readerId } = payload;

  //     this.logger.debug(
  //       `👁️  Messages lus dans conversation ${conversationId} par ${readerId}`,
  //     );

  //     // ======================================================
  //     // 1️⃣ Notifier la room (tous les membres connectés)
  //     // ======================================================
  //     this.wsConnection.sendToRoom(
  //       `conversation_${conversationId}`,
  //       'conversation_read',
  //       {
  //         conversationId,
  //         readerId,
  //         timestamp: Date.now(),
  //       },
  //     );

  //     // ======================================================
  //     // 2️⃣ Notifier l'autre participant directement
  //     // ======================================================
  //     // On doit deviner l'autre utilisateur → tu m'as donné seulement readerId
  //     // Donc c'est le service métier qui DOIT appeler cette méthode
  //     // mais pour garder ton architecture, on utilise un helper WS :

  //     // this.wsConnection.broadcastToOthersInRoom(
  //     //   `conversation_${conversationId}`,
  //     //   client.id,
  //     //   'messageRead',
  //     //   {
  //     //     conversationId,
  //     //     readerId,
  //     //     timestamp: Date.now(),
  //     //   },
  //     // );

  //     // ACK pour le front
  //     return { status: 'ok', message: 'Read event broadcasted' };
  //   } catch (error) {
  //     this.logger.error(
  //       `❌ Erreur handleMessageRead: ${error.message}`,
  //       error.stack,
  //     );
  //     return { status: 'error', message: 'Could not process read event' };
  //   }
  // }

  // ===========================================================
  // Event facultatif pour broadcast à une conversation (room)
  // ===========================================================
  @SubscribeMessage('sendMessageToRoom')
  handleSendMessageToRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; content: string; senderId: string },
  ) {
    try {
      this.logger.debug(
        `📨 Broadcast message to room ${payload.room}: ${payload.content}`,
      );

      this.wsConnection.sendToRoom(payload.room, 'newMessage', {
        from: payload.senderId,
        content: payload.content,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        `❌ Erreur handleSendMessageToRoom: ${error.message}`,
        error.stack,
      );
    }
  }
}
