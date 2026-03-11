import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappAccount } from './whatsapp-account.entity';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectRepository(WhatsappAccount)
    private readonly waRepo: Repository<WhatsappAccount>,
  ) {}

  /* =========================
     Helpers
  ========================= */
  private async safeJson(res: Response): Promise<any> {
    try {
      return (await res.json()) as any;
    } catch {
      return null;
    }
  }

  private graphUrl(path: string) {
    return `https://graph.facebook.com/v20.0${path.startsWith('/') ? path : `/${path}`}`;
  }

  /* =========================
     Accounts
  ========================= */
  async getAccount(tenantId: string, waAccountId: string): Promise<WhatsappAccount | null> {
    return this.waRepo.findOne({
      where: { id: waAccountId, tenantId } as any,
    });
  }

  async getAccountByPhoneNumberId(phoneNumberId: string): Promise<WhatsappAccount | null> {
    return this.waRepo.findOne({
      where: { phoneNumberId } as any,
    });
  }

  /* =========================
     Send messages (wrappers)
  ========================= */
  async sendTextMessage(
    waAccount: WhatsappAccount,
    to: string,
    body: string,
    replyToWaMessageId?: string,
  ): Promise<{ waMessageId?: string }> {
    const cleanTo = to.replace(/\D/g, '');

    const payload: any = {
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: 'text',
      text: { body },
    };

    if (replyToWaMessageId) {
      payload.context = {
        message_id: replyToWaMessageId,
      };
    }

    return this.sendMessage(waAccount, payload);
  }

  async sendTemplateMessage(
    waAccount: WhatsappAccount,
    to: string,
    templateName: string,
    language: string,
    components?: any[],
  ): Promise<{ waMessageId?: string }> {
    const cleanTo = to.replace(/\D/g, '');

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        ...(components?.length ? { components } : {}),
      },
    };

    return this.sendMessage(waAccount, payload);
  }

  /* =========================
     Core send (Cloud API)
  ========================= */
  async sendMessage(
    waAccount: WhatsappAccount,
    payload: any,
  ): Promise<{ waMessageId?: string }> {
    const phoneId = waAccount.phoneNumberId;

    if (!phoneId) {
      throw new Error('WhatsApp phoneNumberId is missing on account');
    }

    const url = this.graphUrl(`/${phoneId}/messages`);

    this.logger.log(`Sending WA message to ${payload.to} using phoneId ${phoneId}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waAccount.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await this.safeJson(res);

    if (!res.ok) {
      const errMsg = data?.error?.message || 'Unknown';
      this.logger.error(`WhatsApp send failed: ${JSON.stringify(data)}`);
      throw new Error(`WhatsApp API error: ${errMsg}`);
    }

    return { waMessageId: data?.messages?.[0]?.id };
  }

  /* =========================
     Templates submission (Meta approval)
  ========================= */
  async submitTemplate(waAccount: WhatsappAccount, payload: any): Promise<{ id?: string }> {
    const url = this.graphUrl(`/${waAccount.wabaId}/message_templates`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waAccount.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await this.safeJson(res);

    if (!res.ok) {
      const errMsg = data?.error?.message || 'Unknown';
      throw new Error(`Template submission error: ${errMsg}`);
    }

    return { id: data?.id };
  }

  /* =========================
     Media download
  ========================= */
  async downloadMedia(waAccount: WhatsappAccount, mediaId: string): Promise<Buffer> {
    const metaRes = await fetch(this.graphUrl(`/${mediaId}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${waAccount.accessToken}`,
      },
    });

    const meta: any = await this.safeJson(metaRes);

    if (!metaRes.ok) {
      const errMsg = meta?.error?.message || 'Unknown';
      throw new Error(`Media meta error: ${errMsg}`);
    }

    const mediaUrl = meta?.url;
    if (!mediaUrl) {
      throw new Error('Media meta missing url');
    }

    const fileRes = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${waAccount.accessToken}`,
      },
    });

    if (!fileRes.ok) {
      const errText = await fileRes.text();
      throw new Error(`Media download error: ${errText || 'Unknown'}`);
    }

    const arr = await fileRes.arrayBuffer();
    return Buffer.from(arr);
  }
}