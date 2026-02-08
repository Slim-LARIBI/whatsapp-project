import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from './ai.service';
import { QUEUE_AI_CLASSIFY } from '@whatsapp-platform/shared';

@Processor(QUEUE_AI_CLASSIFY)
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(private readonly aiService: AiService) {
    super();
  }

  async process(job: Job) {
    const { messageText, conversationId, tenantId } = job.data;

    this.logger.log(`AI classify job for conversation: ${conversationId}`);

    try {
      // 1. Classify intent
      const classification = await this.aiService.classify(messageText);
      this.logger.log(`Intent: ${classification.intent} (${classification.confidence})`);

      // 2. Suggest reply
      const suggestion = await this.aiService.suggestReply(
        job.data.history || [],
        messageText,
      );

      return {
        intent: classification.intent,
        confidence: classification.confidence,
        suggestedReply: suggestion,
        conversationId,
        tenantId,
      };
    } catch (error) {
      this.logger.error(`AI processing failed: ${error}`);
      throw error;
    }
  }
}
