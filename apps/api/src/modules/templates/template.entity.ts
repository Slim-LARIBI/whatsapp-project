import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { WhatsappAccount } from '../whatsapp/whatsapp-account.entity';

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'wa_account_id' })
  waAccountId: string;

  @Column({ name: 'wa_template_id', nullable: true })
  waTemplateId: string;

  @Column()
  name: string;

  @Column({ default: 'en' })
  language: string;

  @Column()
  category: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'jsonb', default: [] })
  components: unknown[];

  @Column({ type: 'jsonb', name: 'example_values', default: {} })
  exampleValues: Record<string, unknown>;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;

  @Column({ name: 'delivered_count', default: 0 })
  deliveredCount: number;

  @Column({ name: 'read_count', default: 0 })
  readCount: number;

  @Column({ name: 'failed_count', default: 0 })
  failedCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => WhatsappAccount)
  @JoinColumn({ name: 'wa_account_id' })
  waAccount: WhatsappAccount;
}
