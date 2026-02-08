import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Conversation } from '../conversations/conversation.entity';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'opt_in_status', default: 'pending' })
  optInStatus: string;

  @Column({ name: 'opt_in_at', nullable: true })
  optInAt: Date;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column('text', { array: true, default: '{}' })
  segments: string[];

  @Column({ type: 'jsonb', name: 'custom_fields', default: {} })
  customFields: Record<string, unknown>;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'country_code', nullable: true })
  countryCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (t) => t.contacts)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => Conversation, (c) => c.contact)
  conversations: Conversation[];
}
