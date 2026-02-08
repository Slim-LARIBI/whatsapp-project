import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { QUEUE_MESSAGE_SEND, isWithin24hWindow, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@whatsapp-platform/shared';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convoRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectQueue(QUEUE_MESSAGE_SEND)
    private readonly sendQueue: Queue,
  ) {}

  async findAll(tenantId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    assignedTo?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(query.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const qb = this.convoRepo.createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .leftJoinAndSelect('c.contact', 'contact')
      .leftJoinAndSelect('c.assignee', 'assignee');

    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }
    if (query.assignedTo) {
      qb.andWhere('c.assigned_to = :assignedTo', { assignedTo: query.assignedTo });
    }

    qb.orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total } };
  }

  async findById(tenantId: string, id: string) {
    const convo = await this.convoRepo.findOne({
      where: { id, tenantId },
      relations: ['contact', 'assignee', 'waAccount'],
    });
    if (!convo) throw new NotFoundException('Conversation not found');
    return convo;
  }

  async getMessages(tenantId: string, conversationId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(query.limit || 50, MAX_PAGE_SIZE);

    const [data, total] = await this.messageRepo.findAndCount({
      where: { conversationId, tenantId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { page, limit, total } };
  }

  async findOrCreateConversation(tenantId: string, contactId: string, waAccountId: string) {
    let convo = await this.convoRepo.findOne({
      where: { tenantId, contactId, waAccountId, status: 'open' },
    });

    if (!convo) {
      convo = this.convoRepo.create({
        tenantId,
        contactId,
        waAccountId,
        status: 'open',
      });
      convo = await this.convoRepo.save(convo);
    }

    return convo;
  }

  async storeInboundMessage(convo: Conversation, data: {
    waMessageId: string;
    type: string;
    content: Record<string, unknown>;
    contactId: string;
  }) {
    const message = this.messageRepo.create({
      tenantId: convo.tenantId,
      conversationId: convo.id,
      contactId: data.contactId,
      waMessageId: data.waMessageId,
      direction: 'inbound',
      type: data.type,
      content: data.content,
      status: 'delivered',
    });
    const saved = await this.messageRepo.save(message);

    // Update conversation
    await this.convoRepo.update(convo.id, {
      lastMessageAt: new Date(),
      lastInboundAt: new Date(),
      unreadCount: () => 'unread_count + 1',
      status: 'open',
    });

    return saved;
  }

  async sendAgentReply(tenantId: string, conversationId: string, senderId: string, body: string) {
    const convo = await this.findById(tenantId, conversationId);

    // Check 24h window
    if (!isWithin24hWindow(convo.lastInboundAt)) {
      throw new BadRequestException(
        'Outside 24h window. Use a template message instead.',
      );
    }

    // Create message record
    const message = this.messageRepo.create({
      tenantId,
      conversationId,
      senderId,
      contactId: convo.contactId,
      direction: 'outbound',
      type: 'text',
      content: { body },
      status: 'pending',
    });
    const saved = await this.messageRepo.save(message);

    // Enqueue for sending via WhatsApp
    await this.sendQueue.add('send-text', {
      messageId: saved.id,
      tenantId,
      waAccountId: convo.waAccountId,
      to: convo.contact?.phone,
      body,
    });

    // Update conversation
    await this.convoRepo.update(convo.id, {
      lastMessageAt: new Date(),
      unreadCount: 0,
    });

    return saved;
  }

  async assign(tenantId: string, id: string, userId: string) {
    await this.convoRepo.update({ id, tenantId }, { assignedTo: userId });
    return this.findById(tenantId, id);
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const update: Partial<Conversation> = { status };
    if (status === 'closed') update.closedAt = new Date();
    await this.convoRepo.update({ id, tenantId }, update);
    return this.findById(tenantId, id);
  }

  async updateMessageStatus(waMessageId: string, status: string, errorCode?: number, errorMessage?: string) {
    await this.messageRepo.update(
      { waMessageId },
      { status, errorCode, errorMessage },
    );
  }
}
