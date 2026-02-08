import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.templatesService.findAll(tenantId, { status, category });
  }

  @Get(':id')
  findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.findById(tenantId, id);
  }

  @Post()
  @Roles('admin', 'manager')
  create(
    @TenantId() tenantId: string,
    @Body() dto: {
      waAccountId: string;
      name: string;
      language: string;
      category: string;
      components: unknown[];
      exampleValues?: Record<string, unknown>;
    },
  ) {
    return this.templatesService.create(tenantId, dto);
  }

  @Post(':id/submit')
  @Roles('admin', 'manager')
  submit(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.submit(tenantId, id);
  }
}
