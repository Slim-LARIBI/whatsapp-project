import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { TenantId, CurrentUser } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: { name: string; slug: string; plan?: string }) {
    return this.tenantsService.create(dto);
  }

  @Get('current')
  getCurrent(@TenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Patch('current')
  @Roles('admin')
  updateCurrent(@TenantId() tenantId: string, @Body() dto: { name?: string; settings?: Record<string, unknown> }) {
    return this.tenantsService.update(tenantId, dto);
  }
}
