// apps/api/src/modules/conversations/conversations.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsGateway } from './conversations.gateway';

import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

import { QUEUE_MESSAGE_SEND } from '@whatsapp-platform/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),

    // ✅ CRITIQUE: rend disponible BullQueue_message.send dans ce module
    BullModule.registerQueue({
      name: QUEUE_MESSAGE_SEND,
    }),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsGateway],
  exports: [ConversationsService, ConversationsGateway],
})
export class ConversationsModule {}