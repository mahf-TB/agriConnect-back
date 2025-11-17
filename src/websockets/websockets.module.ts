import { Global, Module } from '@nestjs/common';
import { MessagingGateway } from './messaging/messaging.gateway';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { BaseGateway } from './base/base.gateway';
import { WebsocketConnectionService } from './websocket-connection.service';

@Global()
@Module({
  providers: [
    MessagingGateway,
    NotificationsGateway,
    WebsocketConnectionService,
  ],
  exports: [
    WebsocketConnectionService,
    MessagingGateway,
    NotificationsGateway,
  ],
})
export class WebsocketsModule {}
