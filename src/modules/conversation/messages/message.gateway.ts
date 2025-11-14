// import {
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayInit,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Logger } from '@nestjs/common';
// import { WebsocketConnectionService } from 'src/websocket-connection.service';
// import { MessagesService } from './messages.service';

// @WebSocketGateway({
//   namespace: '/messages',
//   cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true },
// })
// export class MessageGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   private server: Server;

//   private readonly logger = new Logger(MessageGateway.name);

//   constructor(
//     private readonly connectionService: WebsocketConnectionService,
//     private readonly messagesService: MessagesService,
//   ) {}

//   afterInit(server: Server) {
//     this.connectionService.setServer(server);
//     this.logger.log('✅ MessageGateway initialisé');
//   }

//   handleConnection(client: Socket) {
//     const userId = (client.handshake.query.userId as string) || null;
//     if (!userId) {
//       this.logger.warn(`Connexion sans userId (socket ${client.id}) — déconnecte`);
//       client.disconnect(true);
//       return;
//     }
//     this.connectionService.register(client.id, userId);
//     this.logger.log(`Utilisateur ${userId} connecté (socket ${client.id})`);
//   }

//   handleDisconnect(client: Socket) {
//     const userId = this.connectionService.getUserForSocket(client.id);
//     if (userId) {
//       this.connectionService.unregister(client.id);
//       this.logger.log(`Utilisateur ${userId} déconnecté (socket ${client.id})`);
//     }
//   }

//   /**
//    * Client envoie un message via WebSocket
//    * payload attendu : { expediteurId, destinataireId, contenu?, typeContenu?, fichierUrl?, conversationId? }
//    */
//   @SubscribeMessage('sendMessage')
//   async handleSendMessage(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() payload: any,
//   ) {
//     try {
//       // Persist le message via MessagesService
//       const dto = payload; // assume payload matches CreateMessageDto
//       const message = await this.messagesService.create(dto);

//       // Envoi en temps réel au destinataire
//       if (message && message.destinataireId) {
//         this.connectionService.sendToUser(message.destinataireId, 'message', message);
//       }


//     } catch (error) {
//       this.logger.error(`Erreur en traitant sendMessage: ${error.message}`, error.stack);
//       client.emit('message:error', { message: error.message });
//     }
//   }
// }
