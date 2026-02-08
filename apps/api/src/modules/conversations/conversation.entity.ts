import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Contact } from '../contacts/contact.entity';
import { User } from '../auth/user.entity';
import { WhatsappAccount } from '../whatsapp/whatsapp-account.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'wa_account_id' })
  waAccountId: string;

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ default: 'normal' })
  priority: string;

  @Column({ nullable: true })
  subject: string;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'last_message_at', nullable: true })
  lastMessageAt: Date;

  @Column({ name: 'last_inbound_at', nullable: true })
  lastInboundAt: Date;

  @Column({ name: 'unread_count', default: 0 })
  unreadCount: number;

  @Column({ name: 'is_bot_active', default: false })
  isBotActive: boolean;

  @Column({ name: 'ai_intent', nullable: true })
  aiIntent: string;

  @Column({ name: 'ai_summary', nullable: true })
  aiSummary: string;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Contact, (c) => c.conversations)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @ManyToOne(() => WhatsappAccount)
  @JoinColumn({ name: 'wa_account_id' })
  waAccount: WhatsappAccount;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];
}
