import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async create(dto: { name: string; slug: string; plan?: string }) {
    const tenant = this.tenantRepo.create(dto);
    return this.tenantRepo.save(tenant);
  }

  async findById(id: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: Partial<Tenant>) {
    await this.tenantRepo.update(id, dto);
    return this.findById(id);
  }
}
