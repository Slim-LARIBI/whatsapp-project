import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { AiModule } from './modules/ai/ai.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),

        // ✅ IMPORTANT: charge automatiquement les Entities déclarées dans les modules (forFeature)
        autoLoadEntities: true,

        // ✅ DEV only: crée les tables automatiquement (sinon ta DB reste vide)
        // Mets false + migrations quand tu passes en prod
        synchronize: true,

        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get('REDIS_URL'),
        },
      }),
    }),

    AuthModule,
    TenantsModule,
    ContactsModule,
    ConversationsModule,
    WhatsappModule,
    TemplatesModule,
    AiModule,
    WebhookModule,
  ],
})
export class AppModule {}