import { Module } from '@nestjs/common';
import { MessagesModule } from './messages/messages.module';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';

@Module({
  imports: [MessagesModule],
  providers: [ConversationService],
  controllers: [ConversationController]
})
export class ConversationModule {}
