import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { ConversationsGateway } from './conversations.gateway';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

import {
  QUEUE_MESSAGE_SEND,
  isWithin24hWindow,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@whatsapp-platform/shared';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convoRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectQueue(QUEUE_MESSAGE_SEND)
    private readonly sendQueue: Queue,
    private readonly gateway: ConversationsGateway,
  ) {}

  async findAll(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      assignedTo?: string;
    },
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(query.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const qb = this.convoRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('c.contact', 'contact')
      .leftJoinAndSelect('c.assignee', 'assignee')
      .leftJoinAndSelect('c.waAccount', 'waAccount');

    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    if (query.assignedTo) {
      qb.andWhere('c.assignedTo = :assignedTo', { assignedTo: query.assignedTo });
    }

    qb.orderBy('c.lastMessageAt', 'DESC', 'NULLS LAST')
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

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }

    return convo;
  }

  async getMessages(
    tenantId: string,
    conversationId: string,
    query: { page?: number; limit?: number },
  ) {
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

  // -----------------------------
  // FIND OR CREATE CONVERSATION
  // -----------------------------
  async findOrCreateConversation(tenantId: string, contactId: string, waAccountId: string) {
    let convo = await this.convoRepo.findOne({
      where: { tenantId, contactId, waAccountId, status: 'open' },
    });

    if (!convo) {
      const created = this.convoRepo.create({
        tenantId,
        contactId,
        waAccountId,
        status: 'open',
      });

      convo = await this.convoRepo.save(created);
    }

    return convo;
  }

  // -----------------------------
  // INBOUND MESSAGE
  // -----------------------------
  async storeInboundMessage(
    convo: Conversation,
    data: {
      waMessageId: string;
      type: string;
      content: Record<string, unknown>;
      contactId: string;
    },
  ) {
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

    await this.convoRepo.update(
      { id: convo.id, tenantId: convo.tenantId },
      {
        lastMessageAt: new Date(),
        lastInboundAt: new Date(),
        unreadCount: () => 'unread_count + 1',
        status: 'open',
      },
    );

    this.gateway.emitConversationUpdate(convo.tenantId, {
      conversationId: convo.id,
      update: {
        lastMessageAt: new Date(),
        lastInboundAt: new Date(),
      },
    });

    return saved;
  }

  // -----------------------------
  // OUTBOUND AGENT REPLY
  // -----------------------------
  async sendAgentReply(
    tenantId: string,
    conversationId: string,
    agentUserId: string,
    body: string,
    replyToMessageId?: string,
  ) {
    const convo = await this.convoRepo.findOne({
      where: { id: conversationId, tenantId },
      relations: ['waAccount', 'contact'],
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }

    if (!body?.trim()) {
      throw new BadRequestException('Body is required');
    }

    const within24h = isWithin24hWindow(convo.lastInboundAt ? new Date(convo.lastInboundAt) : null);
    if (!within24h) {
      // throw new BadRequestException('24h window expired. Use template message.');
    }

    let replyToWaMessageId: string | undefined;

    if (replyToMessageId) {
      const parentMessage = await this.messageRepo.findOne({
        where: {
          id: replyToMessageId,
          tenantId,
          conversationId,
        },
      });

      if (parentMessage?.waMessageId) {
        replyToWaMessageId = parentMessage.waMessageId;
      }
    }

    const message = this.messageRepo.create({
      tenantId,
      conversationId,
      contactId: convo.contactId,
      senderId: agentUserId,
      direction: 'outbound',
      type: 'text',
      content: {
        body,
        ...(replyToMessageId ? { replyToMessageId } : {}),
      },
      status: 'pending',
    });

    const saved = await this.messageRepo.save(message);

    await this.sendQueue.add(QUEUE_MESSAGE_SEND, {
      tenantId,
      conversationId,
      waAccountId: convo.waAccountId,
      to: convo.contact?.phone,
      body,
      messageId: saved.id,
      replyToWaMessageId,
    });

    await this.convoRepo.update(
      { id: conversationId, tenantId },
      { lastMessageAt: new Date() },
    );

    this.gateway.emitConversationUpdate(tenantId, {
      conversationId,
      update: { lastMessageAt: new Date() },
    });

    return { ok: true, messageId: saved.id };
  }

  // -----------------------------
  // ASSIGN
  // -----------------------------
  async assign(tenantId: string, conversationId: string, userId: string | null) {
    const convo = await this.convoRepo.findOne({
      where: { id: conversationId, tenantId },
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }

    await this.convoRepo.update(
      { id: conversationId, tenantId },
      { assignedTo: userId || null },
    );

    this.gateway.emitConversationUpdate(tenantId, {
      conversationId,
      update: { assignedTo: userId || null },
    });

    return { ok: true };
  }

  // -----------------------------
  // UPDATE STATUS
  // -----------------------------
  async updateStatus(tenantId: string, conversationId: string, status: string) {
    const convo = await this.convoRepo.findOne({
      where: { id: conversationId, tenantId },
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }

    await this.convoRepo.update(
      { id: conversationId, tenantId },
      { status },
    );

    this.gateway.emitConversationUpdate(tenantId, {
      conversationId,
      update: { status },
    });

    return { ok: true };
  }

  // -----------------------------
  // UPDATE MESSAGE STATUS (webhook)
  // -----------------------------
  async updateMessageStatus(
    tenantId: string,
    waMessageId: string,
    status: string,
    errorCode?: string,
    errorTitle?: string,
  ) {
    const msg = await this.messageRepo.findOne({
      where: { tenantId, waMessageId },
    });

    if (!msg) {
      return { ok: false, reason: 'message_not_found' };
    }

    const rank: Record<string, number> = {
      pending: 0,
      sent: 1,
      delivered: 2,
      read: 3,
      failed: 99,
    };

    const currentRank = rank[msg.status] ?? -1;
    const nextRank = rank[status] ?? -1;

    if (msg.status !== 'failed' && status !== 'failed' && nextRank <= currentRank) {
      return { ok: true, skipped: true };
    }

    await this.messageRepo.update(
      { id: msg.id, tenantId },
      {
        status,
        errorCode: errorCode ? Number(errorCode) : null,
        errorMessage: errorTitle || null,
      },
    );

    this.gateway.emitConversationUpdate(tenantId, {
      conversationId: msg.conversationId,
      update: { lastMessageAt: new Date() },
    });

    return { ok: true };
  }
}