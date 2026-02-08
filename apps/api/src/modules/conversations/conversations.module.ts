import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsGateway } from './conversations.gateway';
import { QUEUE_MESSAGE_SEND } from '@whatsapp-platform/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    BullModule.registerQueue({ name: QUEUE_MESSAGE_SEND }),
  ],
  providers: [ConversationsService, ConversationsGateway],
  controllers: [ConversationsController],
  exports: [ConversationsService],
})
export class ConversationsModule {}
