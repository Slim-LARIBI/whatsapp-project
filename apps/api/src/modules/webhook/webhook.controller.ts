import { Controller, Get, Post, Req, Res, Query, RawBodyRequest, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import * as crypto from 'crypto';

@ApiTags('Webhooks')
@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET — WhatsApp webhook verification (challenge-response).
   * Meta sends this when you register a webhook URL.
   */
  @Get()
  @ApiExcludeEndpoint()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.config.get('WA_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    }

    this.logger.warn('Webhook verification failed');
    return res.status(403).send('Forbidden');
  }

  /**
   * POST — Incoming webhook events from WhatsApp.
   * Handles: messages, status updates, template status changes.
   */
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    // 1. Verify signature
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!this.verifySignature(req.rawBody, signature)) {
      this.logger.warn('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // 2. Respond immediately with 200 (WhatsApp requires fast response)
    res.status(200).send('OK');

    // 3. Process asynchronously
    try {
      await this.webhookService.processWebhook(req.body);
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error}`);
    }
  }

  /**
   * Verify HMAC SHA-256 signature from Meta.
   */
  private verifySignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
    if (!rawBody || !signature) return false;

    const appSecret = this.config.get('WA_APP_SECRET');
    if (!appSecret) {
      this.logger.warn('WA_APP_SECRET not configured, skipping verification');
      return true; // skip in dev if not configured
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
