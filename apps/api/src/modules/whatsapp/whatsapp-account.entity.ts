import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

@Entity('whatsapp_accounts')
export class WhatsappAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'phone_number_id' })
  phoneNumberId: string;

  @Column({ name: 'display_phone' })
  displayPhone: string;

  @Column({ name: 'waba_id', nullable: true })
  wabaId: string;

  @Column({ name: 'access_token' })
  accessToken: string;

  @Column({ name: 'webhook_verify_token', nullable: true })
  webhookVerifyToken: string;

  @Column({ name: 'business_name', nullable: true })
  businessName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (t) => t.whatsappAccounts)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
