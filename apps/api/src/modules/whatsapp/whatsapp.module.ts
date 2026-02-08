import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappAccount } from './whatsapp-account.entity';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { MessageSendProcessor } from './message-send.processor';
import { QUEUE_MESSAGE_SEND } from '@whatsapp-platform/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappAccount]),
    BullModule.registerQueue({ name: QUEUE_MESSAGE_SEND }),
  ],
  providers: [WhatsappService, MessageSendProcessor],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
