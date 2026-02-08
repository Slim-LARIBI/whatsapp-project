import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';
import { QUEUE_AI_CLASSIFY } from '@whatsapp-platform/shared';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_AI_CLASSIFY }),
    ConversationsModule,
  ],
  providers: [AiService, AiProcessor],
  exports: [AiService],
})
export class AiModule {}
