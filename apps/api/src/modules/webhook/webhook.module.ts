import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

import { ContactsModule } from '../contacts/contacts.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule,
    ContactsModule,
    ConversationsModule, // ✅ OBLIGATOIRE pour injecter ConversationsGateway
    WhatsappModule,
    BullModule.registerQueue(
      { name: 'ai.classify' },
      { name: 'webhook.notify' },
    ),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}