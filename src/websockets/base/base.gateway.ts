import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketConnectionService } from '../websocket-connection.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
})
export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  // Logger NestJS classique
  protected readonly logger: Logger;

  constructor(protected readonly wsConnection: WebsocketConnectionService) {
    this.logger = new Logger(this.constructor.name);
  }

  afterInit(server: Server) {
    this.wsConnection.setServer(server);
  }

  async handleConnection(client: Socket) {
    const userId = this.extractUserIdFromHandshake(client);
    // client.handshake.auth?.userId || client.handshake.query.userId;
    if (!userId) {
      this.logger.warn(
        `⚠️ Connexion rejetée: userId manquant (socket: ${client.id})`,
      );
      client.disconnect();
      return;
    }

    this.wsConnection.register(client.id, String(userId));
  }

  handleDisconnect(client: Socket) {
    const userId = this.wsConnection.getUserForSocket(client.id);
    this.wsConnection.unregister(client.id);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  //   /**
  //    * Extrait l'userId du handshake WebSocket
  //    * @param client Socket du client
  //    * @returns userId ou null
  //    */
  protected extractUserIdFromHandshake(client: Socket): string | null {
    try {
      const userId = client.handshake.query.userId as string;
      // client.handshake.auth?.userId || client.handshake.query.userId
      return userId && userId.trim() ? userId.trim() : null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'extraction du userId: ${error.message}`,
      );
      return null;
    }
  }
}
