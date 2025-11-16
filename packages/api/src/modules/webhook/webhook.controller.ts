import { Controller, Post, Delete, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { WebhookEvent } from './webhook.types';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Register a webhook endpoint' })
  async register(
    @CurrentUser() user: User,
    @Body() body: { url: string; events: WebhookEvent[]; secret?: string },
  ) {
    const secret = await this.webhookService.register(
      user.tenantId,
      body.url,
      body.events,
      body.secret,
    );

    return {
      message: 'Webhook registered successfully',
      secret, // Return secret only once
      url: body.url,
      events: body.events,
    };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all webhooks' })
  async list(@CurrentUser() user: User) {
    const webhooks = await this.webhookService.list(user.tenantId);
    return { webhooks };
  }

  @Delete(':url')
  @Roles('admin')
  @ApiOperation({ summary: 'Unregister a webhook' })
  async unregister(@CurrentUser() user: User, @Param('url') url: string) {
    await this.webhookService.unregister(user.tenantId, decodeURIComponent(url));
    return { message: 'Webhook unregistered successfully' };
  }

  @Post('test')
  @Roles('admin')
  @ApiOperation({ summary: 'Send a test webhook' })
  async test(@CurrentUser() user: User, @Body() body: { event: WebhookEvent }) {
    await this.webhookService.trigger(user.tenantId, body.event, {
      test: true,
      message: 'This is a test webhook',
    });

    return { message: 'Test webhook triggered' };
  }
}
