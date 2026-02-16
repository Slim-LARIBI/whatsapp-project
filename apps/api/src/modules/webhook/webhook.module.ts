import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { ContactsModule } from '../contacts/contacts.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { TemplatesModule } from '../templates/templates.module';
import { QUEUE_AI_CLASSIFY, QUEUE_WEBHOOK_NOTIFY } from '@whatsapp-platform/shared';

// ✅ AJOUTE CET IMPORT (chemin probable)
import { ConversationsGateway } from '../conversations/conversations.gateway';

@Module({
  imports: [
    ContactsModule,
    ConversationsModule,
    WhatsappModule,
    TemplatesModule,
    BullModule.registerQueue(
      { name: QUEUE_AI_CLASSIFY },
      { name: QUEUE_WEBHOOK_NOTIFY },
    ),
  ],
  controllers: [WebhookController],
  // ✅ AJOUTE ConversationsGateway ici
  providers: [WebhookService, ConversationsGateway],
})
export class WebhookModule {}