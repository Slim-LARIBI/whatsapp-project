import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappService } from './whatsapp.service';
import { WhatsappAccount } from './whatsapp-account.entity';
import { QUEUE_MESSAGE_SEND } from '@whatsapp-platform/shared';
import { Message } from '../conversations/message.entity';

@Processor(QUEUE_MESSAGE_SEND)
export class MessageSendProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageSendProcessor.name);

  constructor(
    private readonly waService: WhatsappService,
    @InjectRepository(WhatsappAccount)
    private readonly waAccountRepo: Repository<WhatsappAccount>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {
    super();
  }

  async process(job: Job) {
    const {
      messageId,
      tenantId,
      waAccountId,
      to,
      body,
      templateName,
      language,
      components,
      replyToWaMessageId,
    } = job.data;

    this.logger.log(`Processing message send: ${messageId}`);

    const waAccount = await this.waAccountRepo.findOne({
      where: { id: waAccountId, tenantId },
    });

    if (!waAccount) {
      await this.messageRepo.update(
        { id: messageId, tenantId },
        {
          status: 'failed',
          errorMessage: 'WhatsApp account not found',
        },
      );

      this.logger.error(`WA account not found: ${waAccountId}`);
      throw new Error('WhatsApp account not found');
    }

    try {
      let waMessageId: string | undefined;

      if (templateName) {
        const result = await this.waService.sendTemplateMessage(
          waAccount,
          to,
          templateName,
          language,
          components,
        );
        waMessageId = result.waMessageId;
      } else {
        const result = await this.waService.sendTextMessage(
          waAccount,
          to,
          body,
          replyToWaMessageId,
        );
        waMessageId = result.waMessageId;
      }

      await this.messageRepo.update(
        { id: messageId, tenantId },
        {
          status: 'sent',
          waMessageId: waMessageId || null,
          errorCode: null,
          errorMessage: null,
        },
      );

      this.logger.log(`Message sent: ${waMessageId}`);

      return { waMessageId, messageId };
    } catch (error: any) {
      await this.messageRepo.update(
        { id: messageId, tenantId },
        {
          status: 'failed',
          errorMessage: error?.message || 'Unknown send error',
        },
      );

      this.logger.error(`Failed to send message ${messageId}: ${error?.message || error}`);
      throw error;
    }
  }
}