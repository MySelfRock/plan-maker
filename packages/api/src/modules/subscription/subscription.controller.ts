import { Controller, Get, Post, Body, UseGuards, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Request } from 'express';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getCurrentSubscription(@CurrentUser() user: User) {
    return this.subscriptionService.findUserSubscription(user.id);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createCheckoutSession(@CurrentUser() user: User, @Body() body: { planTier: string }) {
    return this.subscriptionService.createCheckoutSession(user.id, user.tenantId, body.planTier);
  }

  @Post('webhook')
  @Public()
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    // Stripe webhook handler (requires raw body)
    const signature = req.headers['stripe-signature'];
    // const event = this.stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    // await this.subscriptionService.handleWebhook(event);
    return { received: true };
  }
}
