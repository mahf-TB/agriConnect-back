import { Module } from '@nestjs/common';
import { MessagesModule } from './messages/messages.module';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [MessagesModule],
  providers: [ConversationService, PrismaService],
  controllers: [ConversationController]
})
export class ConversationModule {}
