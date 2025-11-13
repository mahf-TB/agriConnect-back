import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [NotificationGateway, NotificationsService, PrismaService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationGateway],
})
export class NotificationsModule {}
