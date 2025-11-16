import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeKey || 'sk_test_dummy', {
      apiVersion: '2023-10-16',
    });
  }

  async findUserSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCheckoutSession(userId: string, tenantId: string, planTier: string) {
    // This is a simplified version - in production you'd get prices from DB
    const session = await this.stripe.checkout.sessions.create({
      customer_email: (await this.prisma.user.findUnique({ where: { id: userId } }))?.email,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `PlanMaker ${planTier}`,
            },
            unit_amount: planTier === 'starter' ? 1990 : 4990, // R$ 19.90 or 49.90
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: this.configService.get<string>('FRONTEND_URL') + '/dashboard?payment=success',
      cancel_url: this.configService.get<string>('FRONTEND_URL') + '/pricing?payment=cancelled',
      metadata: {
        userId,
        tenantId,
        planTier,
      },
    });

    return { sessionUrl: session.url };
  }

  async handleWebhook(event: Stripe.Event) {
    // Handle Stripe webhooks (subscription.created, payment.succeeded, etc.)
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.createSubscription(session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription updates/cancellations
        break;
    }
  }

  private async createSubscription(session: Stripe.Checkout.Session) {
    const { userId, tenantId, planTier } = session.metadata;

    await this.prisma.subscription.create({
      data: {
        userId,
        tenantId,
        planTier,
        status: 'active',
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: session.customer as string,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }
}
