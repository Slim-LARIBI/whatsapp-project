import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  WAWebhookPayload,
  WAWebhookMessage,
  WAWebhookStatus,
  QUEUE_AI_CLASSIFY,
  QUEUE_WEBHOOK_NOTIFY,
  REDIS_PREFIX_IDEMPOTENCY,
} from '@whatsapp-platform/shared';
import { ContactsService } from '../contacts/contacts.service';
import { ConversationsService } from '../conversations/conversations.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConversationsGateway } from '../conversations/conversations.gateway';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly redis: Redis;

  constructor(
    private readonly contactsService: ContactsService,
    private readonly convoService: ConversationsService,
    private readonly waService: WhatsappService,
    private readonly gateway: ConversationsGateway,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_AI_CLASSIFY) private readonly aiQueue: Queue,
    @InjectQueue(QUEUE_WEBHOOK_NOTIFY) private readonly notifyQueue: Queue,
  ) {
    this.redis = new Redis(config.get('REDIS_URL'));
  }

  async processWebhook(payload: WAWebhookPayload) {
    if (payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const phoneNumberId = value.metadata.phone_number_id;

        // Resolve WA account + tenant
        const waAccount = await this.waService.getAccountByPhoneNumberId(phoneNumberId);
        if (!waAccount) {
          this.logger.warn(`Unknown phone_number_id: ${phoneNumberId}`);
          continue;
        }

        // Process inbound messages
        if (value.messages?.length) {
          for (const msg of value.messages) {
            await this.handleInboundMessage(waAccount.tenantId, waAccount.id, msg, value.contacts?.[0]);
          }
        }

        // Process status updates
        if (value.statuses?.length) {
          for (const status of value.statuses) {
            await this.handleStatusUpdate(waAccount.tenantId, status);
          }
        }
      }
    }
  }

  private async handleInboundMessage(
    tenantId: string,
    waAccountId: string,
    msg: WAWebhookMessage,
    waContact?: { profile: { name: string }; wa_id: string },
  ) {
    // Idempotency check
    const idempotencyKey = `${REDIS_PREFIX_IDEMPOTENCY}${msg.id}`;
    const exists = await this.redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');
    if (!exists) {
      this.logger.debug(`Duplicate message skipped: ${msg.id}`);
      return;
    }

    this.logger.log(`Inbound message: ${msg.id} from ${msg.from}`);

    // 1. Upsert contact
    const contact = await this.contactsService.upsertByPhone(tenantId, msg.from, {
      name: waContact?.profile?.name,
    });

    // 2. Find or create conversation
    const convo = await this.convoService.findOrCreateConversation(tenantId, contact.id, waAccountId);

    // 3. Parse content
    const content = this.parseMessageContent(msg);

    // 4. Store message
    const message = await this.convoService.storeInboundMessage(convo, {
      waMessageId: msg.id,
      type: msg.type,
      content,
      contactId: contact.id,
    });

    // 5. Emit real-time event
    this.gateway.emitNewMessage(tenantId, {
      conversationId: convo.id,
      message,
    });

    // 6. Enqueue AI classification
    if (msg.type === 'text' && msg.text?.body) {
      await this.aiQueue.add('classify', {
        messageText: msg.text.body,
        conversationId: convo.id,
        tenantId,
      });
    }

    // 7. Notify n8n (if configured)
    await this.notifyQueue.add('inbound', {
      tenantId,
      conversationId: convo.id,
      contactId: contact.id,
      messageId: message.id,
      type: msg.type,
      content,
    });
  }

  private async handleStatusUpdate(tenantId: string, status: WAWebhookStatus) {
    this.logger.debug(`Status update: ${status.id} → ${status.status}`);

    await this.convoService.updateMessageStatus(
      status.id,
      status.status,
      status.errors?.[0]?.code,
      status.errors?.[0]?.title,
    );

    // Emit real-time status update
    this.gateway.emitMessageStatus(tenantId, {
      messageId: status.id,
      status: status.status,
    });
  }

  private parseMessageContent(msg: WAWebhookMessage): Record<string, unknown> {
    switch (msg.type) {
      case 'text':
        return { body: msg.text?.body };
      case 'image':
        return { mediaId: msg.image?.id, mimeType: msg.image?.mime_type, caption: msg.image?.caption };
      case 'video':
        return { mediaId: msg.video?.id, mimeType: msg.video?.mime_type, caption: msg.video?.caption };
      case 'audio':
        return { mediaId: msg.audio?.id, mimeType: msg.audio?.mime_type };
      case 'document':
        return { mediaId: msg.document?.id, mimeType: msg.document?.mime_type, filename: msg.document?.filename };
      case 'location':
        return { latitude: msg.location?.latitude, longitude: msg.location?.longitude, name: msg.location?.name };
      case 'reaction':
        return { messageId: msg.reaction?.message_id, emoji: msg.reaction?.emoji };
      default:
        return { raw: msg };
    }
  }
}
