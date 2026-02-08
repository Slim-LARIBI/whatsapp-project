import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappAccount } from './whatsapp-account.entity';
import { WA_API_BASE } from '@whatsapp-platform/shared';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectRepository(WhatsappAccount)
    private readonly waAccountRepo: Repository<WhatsappAccount>,
  ) {}

  async getAccount(tenantId: string, waAccountId: string) {
    return this.waAccountRepo.findOne({
      where: { id: waAccountId, tenantId },
    });
  }

  async getAccountByPhoneNumberId(phoneNumberId: string) {
    return this.waAccountRepo.findOne({
      where: { phoneNumberId },
    });
  }

  /**
   * Send a free-form text message via WhatsApp Cloud API.
   */
  async sendTextMessage(waAccount: WhatsappAccount, to: string, body: string): Promise<{ waMessageId: string }> {
    const url = `${WA_API_BASE}/${waAccount.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waAccount.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      this.logger.error(`WA API error: ${JSON.stringify(error)}`);
      throw new Error(`WhatsApp API error: ${error.error?.message || 'Unknown'}`);
    }

    const result = await response.json();
    return { waMessageId: result.messages?.[0]?.id };
  }

  /**
   * Send a template message via WhatsApp Cloud API.
   */
  async sendTemplateMessage(
    waAccount: WhatsappAccount,
    to: string,
    templateName: string,
    language: string,
    components?: unknown[],
  ): Promise<{ waMessageId: string }> {
    const url = `${WA_API_BASE}/${waAccount.phoneNumberId}/messages`;

    const templatePayload: Record<string, unknown> = {
      name: templateName,
      language: { code: language },
    };
    if (components?.length) {
      templatePayload.components = components;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waAccount.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: templatePayload,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      this.logger.error(`WA template error: ${JSON.stringify(error)}`);
      throw new Error(`WhatsApp API error: ${error.error?.message || 'Unknown'}`);
    }

    const result = await response.json();
    return { waMessageId: result.messages?.[0]?.id };
  }

  /**
   * Submit a template to Meta for approval.
   */
  async submitTemplate(
    waAccount: WhatsappAccount,
    template: {
      name: string;
      language: string;
      category: string;
      components: unknown[];
    },
  ) {
    const url = `${WA_API_BASE}/${waAccount.wabaId}/message_templates`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waAccount.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: template.name,
        language: template.language,
        category: template.category,
        components: template.components,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Template submission error: ${error.error?.message || 'Unknown'}`);
    }

    return response.json();
  }

  /**
   * Download media from WhatsApp.
   */
  async downloadMedia(waAccount: WhatsappAccount, mediaId: string): Promise<Buffer> {
    // Step 1: Get media URL
    const metaUrl = `${WA_API_BASE}/${mediaId}`;
    const metaRes = await fetch(metaUrl, {
      headers: { 'Authorization': `Bearer ${waAccount.accessToken}` },
    });
    const meta = await metaRes.json();

    // Step 2: Download actual file
    const fileRes = await fetch(meta.url, {
      headers: { 'Authorization': `Bearer ${waAccount.accessToken}` },
    });
    const arrayBuffer = await fileRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
