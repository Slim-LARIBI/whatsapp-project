import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../auth/user.entity';
import { Contact } from '../contacts/contact.entity';
import { WhatsappAccount } from '../whatsapp/whatsapp-account.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: 'free' })
  plan: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (u) => u.tenant)
  users: User[];

  @OneToMany(() => Contact, (c) => c.tenant)
  contacts: Contact[];

  @OneToMany(() => WhatsappAccount, (wa) => wa.tenant)
  whatsappAccounts: WhatsappAccount[];
}
