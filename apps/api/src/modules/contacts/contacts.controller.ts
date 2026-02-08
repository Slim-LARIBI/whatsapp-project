import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('optInStatus') optInStatus?: string,
  ) {
    return this.contactsService.findAll(tenantId, { page, limit, search, optInStatus });
  }

  @Get(':id')
  findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findById(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: { phone: string; name?: string; email?: string; tags?: string[] }) {
    return this.contactsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.contactsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  delete(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.delete(tenantId, id);
  }

  @Post('import')
  @Roles('admin', 'manager')
  bulkImport(
    @TenantId() tenantId: string,
    @Body() dto: { rows: Array<{ phone: string; name?: string; email?: string; tags?: string[] }> },
  ) {
    return this.contactsService.bulkImport(tenantId, dto.rows);
  }
}
