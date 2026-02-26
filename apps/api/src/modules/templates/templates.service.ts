import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from './template.entity';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepo: Repository<MessageTemplate>,
    private readonly waService: WhatsappService,
  ) {}

  async findAll(tenantId: string, query: { status?: string; category?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    return this.templateRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(tenantId: string, id: string) {
    const template = await this.templateRepo.findOne({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(
    tenantId: string,
    dto: {
      waAccountId: string;
      name: string;
      language: string;
      category: string;
      components: unknown[];
      exampleValues?: Record<string, unknown>;
    },
  ) {
    const template = this.templateRepo.create({
      tenantId,
      waAccountId: dto.waAccountId,
      name: dto.name,
      language: dto.language,
      category: dto.category,
      components: dto.components,
      exampleValues: dto.exampleValues || {},
      status: 'draft',
    });
    return this.templateRepo.save(template);
  }

  /**
   * Submit a draft template to Meta for approval.
   * Updates status from 'draft' to 'pending'.
   */
  async submit(tenantId: string, id: string) {
    const template = await this.findById(tenantId, id);
    const waAccount = await this.waService.getAccount(tenantId, template.waAccountId);
    if (!waAccount) throw new NotFoundException('WhatsApp account not found');

    // ✅ FIX: ce retour venait typé unknown dans waService
    const result: any = await this.waService.submitTemplate(waAccount, {
      name: template.name,
      language: template.language,
      category: template.category,
      components: template.components,
    });

    template.status = 'pending';
    template.waTemplateId = result?.id ?? null;
    return this.templateRepo.save(template);
  }

  /**
   * Called by webhook when Meta sends a template status update.
   */
  async updateStatusFromWebhook(waTemplateId: string, status: string, reason?: string) {
    const template = await this.templateRepo.findOne({ where: { waTemplateId } });
    if (!template) return;

    template.status = status;
    if (reason) template.rejectionReason = reason;
    await this.templateRepo.save(template);
  }

  async incrementStats(
    templateId: string,
    field: 'sentCount' | 'deliveredCount' | 'readCount' | 'failedCount',
  ) {
    await this.templateRepo.increment({ id: templateId }, field, 1);
  }
}