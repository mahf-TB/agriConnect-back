// import {
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   OnGatewayInit,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Logger } from '@nestjs/common';
// import { WebsocketConnectionService } from 'src/websocket-connection.service';

// /**
//  * Gateway WebSocket pour la gestion des notifications en temps réel
//  * 
//  * Responsabilités :
//  * - Gérer les connexions/déconnexions des clients WebSocket
//  * - Maintenir le mapping entre socketId et userId
//  * - Envoyer les notifications aux utilisateurs spécifiques ou en broadcast
//  * - Logger les événements importants
//  */
// @WebSocketGateway({
//   cors: {
//     origin: process.env.CORS_ORIGIN || '*',
//     credentials: true,
//   },
//   namespace: '/notifications',
// })
// export class NotificationGateway
//   implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
// {
//   @WebSocketServer()
//   private server: Server;
//   private readonly logger = new Logger(NotificationGateway.name);
//   constructor(private readonly connectionService: WebsocketConnectionService) {}

//   /**
//    * Appelé après l'initialisation du gateway
//    */
//   afterInit(server: Server) {
//     // enregistrer le server dans le service partagé
//     this.connectionService.setServer(server);
//     this.logger.log('✅ NotificationGateway initialisé');
//   }

//   /**
//    * Gère la connexion d'un client WebSocket
//    * @param client Socket du client connecté
//    */
//   handleConnection(client: Socket) {
//     try {
//       const userId = this.extractUserIdFromHandshake(client);

//       if (!userId) {
//         this.logger.warn(
//           `⚠️ Connexion rejetée: userId manquant (socket: ${client.id})`,
//         );
//         client.disconnect(true);
//         return;
//       }

//       // Enregistrer la connexion via le service partagé
//       this.connectionService.register(client.id, userId);

//       this.logger.log(`✅ Utilisateur ${userId} connecté (socket: ${client.id})`);
//       this.logConnectionStats();
//     } catch (error) {
//       this.logger.error(
//         `❌ Erreur lors de la connexion: ${error.message}`,
//         error.stack,
//       );
//       client.disconnect(true);
//     }
//   }

//   /**
//    * Gère la déconnexion d'un client WebSocket
//    * @param client Socket du client déconnecté
//    */
//   handleDisconnect(client: Socket) {
//     try {
//       const userId = this.connectionService.getUserForSocket(client.id);

//       if (!userId) {
//         this.logger.warn(`⚠️ Déconnexion: userId introuvable pour ${client.id}`);
//         return;
//       }

//       // Supprimer la connexion via le service partagé
//       this.connectionService.unregister(client.id);

//       this.logger.log(`🔌 Utilisateur ${userId} déconnecté (socket: ${client.id})`);
//       this.logConnectionStats();
//     } catch (error) {
//       this.logger.error(
//         `❌ Erreur lors de la déconnexion: ${error.message}`,
//         error.stack,
//       );
//     }
//   }

//   /**
//    * Envoie une notification à un utilisateur spécifique
//    * @param userId ID de l'utilisateur cible
//    * @param data Données de la notification
//    */
//   sendToUser(userId: string, data: any) {
//     this.connectionService.sendToUser(userId, 'notification', data);
//   }

//   /**
//    * Envoie une notification à plusieurs utilisateurs
//    * @param userIds Liste des IDs d'utilisateurs
//    * @param data Données de la notification
//    */
//   sendToUsers(userIds: string[], data: any) {
//     this.connectionService.sendToUsers(userIds, 'notification', data);
//   }

//   /**
//    * Envoie une notification en broadcast à tous les clients connectés
//    * @param data Données de broadcast(data: any) {
//     this.connectionService.broadcast('notification', data);
//   }

//   /**
//    * Envoie un message à une room/channel spécifique
//    * @param room Nom de la room
//    * @param data Données du message
//    */
//   sendToRoom(room: string, data: any) {
//     this.connectionService.sendToRoom(room, 'notification', data);
//     this.logger.debug(`📤 Message envoyé à la room: ${room}`);
//   }

//   /**
//    * Event listener pour les messages custom du client
//    * (optionnel pour permettre au client d'envoyer des messages)
//    */
//   @SubscribeMessage('message')
//   handleMessage(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: any,
//   ) {
//     try {
//       const userId = this.connectionService.getUserForSocket(client.id);

//       this.logger.debug(`📨 Message reçu de ${userId}: ${JSON.stringify(data)}`);

//       // Vous pouvez traiter le message ici
//       // Par exemple, sauvegarder en base de données, relayer à d'autres utilisateurs, etc.
//     } catch (error) {
//       this.logger.error(
//         `❌ Erreur lors de la réception du message: ${error.message}`,
//         error.stack,
//       );
//     }
//   }

//   // ============================================================================
//   // PRIVATE HELPER METHODS
//   // ============================================================================

//   /**
//    * Extrait l'userId du handshake WebSocket
//    * @param client Socket du client
//    * @returns userId ou null
//    */
//   private extractUserIdFromHandshake(client: Socket): string | null {
//     try {
//       const userId = client.handshake.query.userId as string;
//       return userId && userId.trim() ? userId.trim() : null;
//     } catch (error) {
//       this.logger.error(
//         `Erreur lors de l'extraction du userId: ${error.message}`,
//       );
//       return null;
//     }
//   }


//   /**
//    * Affiche les statistiques de connexion (debug)
//    */
//   private logConnectionStats() {
//     const totalConnections = this.connectionService.getTotalConnections();
//     const uniqueUsers = this.connectionService.getUniqueUsersCount();

//     this.logger.debug(`📊 Connexions: ${totalConnections} socket(s), ${uniqueUsers} utilisateur(s)`);
//   }

//   /**
//    * Retourne le nombre de connexions actives d'un utilisateur
//    * (peut être exposé via une route d'admin)
//    * @param userId ID de l'utilisateur
//    * @returns Nombre de connexions
//    */
//   getActiveConnectionsForUser(userId: string): number {
//     return this.connectionService.getActiveConnectionsForUser(userId);
//   }

//   /**
//    * Retourne le nombre total de connexions actives
//    * (peut être exposé via une route d'admin)
//    * @returns Nombre de connexions
//    */
//   getTotalActiveConnections(): number {
//     return this.connectionService.getTotalConnections();
//   }
// }
