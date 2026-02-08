import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { TenantId, CurrentUser } from '../../common/decorators/tenant.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly convoService: ConversationsService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.convoService.findAll(tenantId, { page, limit, status, assignedTo });
  }

  @Get(':id')
  findById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.convoService.findById(tenantId, id);
  }

  @Get(':id/messages')
  getMessages(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.convoService.getMessages(tenantId, id, { page, limit });
  }

  @Post(':id/messages')
  sendReply(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: { body: string },
  ) {
    return this.convoService.sendAgentReply(tenantId, id, user.userId, dto.body);
  }

  @Patch(':id/assign')
  assign(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { userId: string },
  ) {
    return this.convoService.assign(tenantId, id, dto.userId);
  }

  @Patch(':id/status')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    return this.convoService.updateStatus(tenantId, id, dto.status);
  }
}
