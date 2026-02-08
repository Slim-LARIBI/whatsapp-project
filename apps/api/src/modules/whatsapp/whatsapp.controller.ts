import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('WhatsApp Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly waService: WhatsappService) {}

  @Post('send-template')
  @Roles('admin', 'manager', 'agent')
  async sendTemplate(
    @TenantId() tenantId: string,
    @Body() dto: {
      waAccountId: string;
      to: string;
      templateName: string;
      language: string;
      components?: unknown[];
    },
  ) {
    const account = await this.waService.getAccount(tenantId, dto.waAccountId);
    if (!account) throw new Error('Account not found');

    return this.waService.sendTemplateMessage(
      account,
      dto.to,
      dto.templateName,
      dto.language,
      dto.components,
    );
  }
}
