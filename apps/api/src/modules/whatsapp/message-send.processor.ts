import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappService } from './whatsapp.service';
import { WhatsappAccount } from './whatsapp-account.entity';
import { QUEUE_MESSAGE_SEND } from '@whatsapp-platform/shared';

// Import inline to avoid circular deps — Message entity
import { Message } from '../conversations/message.entity';

@Processor(QUEUE_MESSAGE_SEND)
export class MessageSendProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageSendProcessor.name);

  constructor(
    private readonly waService: WhatsappService,
    @InjectRepository(WhatsappAccount)
    private readonly waAccountRepo: Repository<WhatsappAccount>,
  ) {
    super();
  }

  async process(job: Job) {
    const { messageId, tenantId, waAccountId, to, body, templateName, language, components } = job.data;

    this.logger.log(`Processing message send: ${messageId}`);

    const waAccount = await this.waAccountRepo.findOne({
      where: { id: waAccountId, tenantId },
    });

    if (!waAccount) {
      this.logger.error(`WA account not found: ${waAccountId}`);
      throw new Error('WhatsApp account not found');
    }

    try {
      let waMessageId: string;

      if (templateName) {
        // Template message
        const result = await this.waService.sendTemplateMessage(
          waAccount, to, templateName, language, components,
        );
        waMessageId = result.waMessageId;
      } else {
        // Free-form text
        const result = await this.waService.sendTextMessage(waAccount, to, body);
        waMessageId = result.waMessageId;
      }

      this.logger.log(`Message sent: ${waMessageId}`);

      // Return for status update — the webhook handler will update delivery status
      return { waMessageId, messageId };
    } catch (error) {
      this.logger.error(`Failed to send message ${messageId}: ${error}`);
      throw error;
    }
  }
}
