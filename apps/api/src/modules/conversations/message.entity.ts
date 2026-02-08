import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Conversation } from './conversation.entity';
import { Contact } from '../contacts/contact.entity';
import { User } from '../auth/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column({ name: 'contact_id', nullable: true })
  contactId: string;

  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @Column({ name: 'wa_message_id', nullable: true })
  waMessageId: string;

  @Column()
  direction: string;

  @Column({ default: 'text' })
  type: string;

  @Column({ type: 'jsonb', default: {} })
  content: Record<string, unknown>;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'error_code', nullable: true })
  errorCode: number;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Conversation, (c) => c.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
