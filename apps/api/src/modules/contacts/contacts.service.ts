import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Contact } from './contact.entity';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@whatsapp-platform/shared';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async findAll(tenantId: string, query: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    optInStatus?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(query.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const qb = this.contactRepo.createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (query.search) {
      qb.andWhere('(c.name ILIKE :search OR c.phone ILIKE :search OR c.email ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.tags?.length) {
      qb.andWhere('c.tags && :tags', { tags: query.tags });
    }

    if (query.optInStatus) {
      qb.andWhere('c.opt_in_status = :optInStatus', { optInStatus: query.optInStatus });
    }

    qb.orderBy('c.updated_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total } };
  }

  async findById(tenantId: string, id: string) {
    const contact = await this.contactRepo.findOne({
      where: { id, tenantId },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async findByPhone(tenantId: string, phone: string) {
    return this.contactRepo.findOne({
      where: { tenantId, phone },
    });
  }

  async upsertByPhone(tenantId: string, phone: string, data: Partial<Contact>) {
    let contact = await this.findByPhone(tenantId, phone);
    if (contact) {
      Object.assign(contact, data);
      return this.contactRepo.save(contact);
    }
    contact = this.contactRepo.create({ tenantId, phone, ...data });
    return this.contactRepo.save(contact);
  }

  async create(tenantId: string, dto: Partial<Contact>) {
    const contact = this.contactRepo.create({ ...dto, tenantId });
    return this.contactRepo.save(contact);
  }

  async update(tenantId: string, id: string, dto: Partial<Contact>) {
    const contact = await this.findById(tenantId, id);
    Object.assign(contact, dto);
    return this.contactRepo.save(contact);
  }

  async delete(tenantId: string, id: string) {
    const contact = await this.findById(tenantId, id);
    await this.contactRepo.remove(contact);
  }

  /**
   * Bulk import contacts from parsed CSV rows.
   */
  async bulkImport(tenantId: string, rows: Array<{ phone: string; name?: string; email?: string; tags?: string[] }>) {
    const results = { created: 0, updated: 0, errors: 0 };

    for (const row of rows) {
      try {
        const existing = await this.findByPhone(tenantId, row.phone);
        if (existing) {
          await this.contactRepo.update(existing.id, {
            name: row.name || existing.name,
            email: row.email || existing.email,
            tags: row.tags?.length ? [...new Set([...existing.tags, ...row.tags])] : existing.tags,
          });
          results.updated++;
        } else {
          await this.contactRepo.save(this.contactRepo.create({
            tenantId,
            phone: row.phone,
            name: row.name,
            email: row.email,
            tags: row.tags || [],
            optInStatus: 'pending',
          }));
          results.created++;
        }
      } catch {
        results.errors++;
      }
    }

    return results;
  }
}
