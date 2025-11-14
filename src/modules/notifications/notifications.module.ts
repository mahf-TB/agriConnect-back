import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from 'src/prisma.service';
import { WebsocketsModule } from 'src/common/websockets/websockets.module';
// import { WebsocketConnectionService } from 'src/websocket-connection.service';

@Module({
  imports: [WebsocketsModule],
  providers: [NotificationsService, PrismaService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
