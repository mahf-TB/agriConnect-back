import { SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { BaseGateway } from '../base/base.gateway';
import { WebsocketConnectionService } from '../websocket-connection.service';
import { Server, Socket } from 'socket.io';


type NotifyPayload = {
  userId: string;
  title?: string;
  message: string;
  type?: string;
  metadata?: any;
};

export class NotificationsGateway extends BaseGateway {

  @WebSocketServer()
  override server: Server;


  constructor(
    protected readonly wsConnection: WebsocketConnectionService,
  ) {
    super(wsConnection);
  }

  /**
   * Réception d’un événement venant du front :
   * Le client émet : socket.emit("notify", payload)
   */
  @SubscribeMessage('notify')
  handleNotify(@MessageBody() payload: NotifyPayload) {
    // Logique : envoyer à un utilisateur précis
    this.sendNotificationToUser(payload.userId, payload);

    return {
      status: 'ok',
      event: 'notify',
      deliveredTo: payload.userId,
    };
  }

  /**
   * Envoyer une notification (API interne pour d’autres modules)
   */
  sendNotificationToUser(userId: string, payload: any) {
    this.wsConnection.sendToUser(userId, 'notification', {
      ...payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Envoyer une notification à plusieurs utilisateurs
   */
  sendNotificationToUsers(userIds: string[], payload: any) {
    this.wsConnection.sendToUsers(userIds, 'notification', {
      ...payload,
      timestamp: Date.now(),
    });
  }


   /**
   * Envoie un message à une room/channel spécifique
   * @param room Nom de la room
   * @param data Données du message
   */
  sendToRoom(room: string, data: any) {
    this.wsConnection.sendToRoom(room, 'notification', data);
    this.logger.debug(`📤 Message envoyé à la room: ${room}`);
  }

  /**
   * Exemple override optionnel (si tu veux loguer les connexions)
   */

   // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
  


}

