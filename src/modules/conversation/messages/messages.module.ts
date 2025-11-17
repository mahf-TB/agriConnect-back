import { Module, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaService } from 'src/prisma.service';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { WebsocketsModule } from 'src/websockets/websockets.module';
import { ConversationService } from '../conversation.service';


@Module({
  imports: [NotificationsModule],
  providers: [MessagesService, PrismaService, ConversationService],
  controllers: [MessagesController],
  exports: [],
})
export class MessagesModule {}
