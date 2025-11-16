import { z } from 'zod';

/**
 * Subscription and Payment Types
 */

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
}

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

export interface PricingPlan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string;
  priceMonthly: number; // in cents
  priceYearly?: number; // in cents
  currency: string;
  features: string[];
  limits: {
    maxPlans?: number;
    maxSessions?: number;
    maxUsers?: number; // for team/coach plans
    aiGenerationsPerMonth?: number;
    customBranding?: boolean;
    apiAccess?: boolean;
  };
  stripePriceId?: string;
  stripeProductId?: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  tenantId: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  stripeInvoiceId?: string;
  amount: number; // in cents
  currency: string;
  status: string;
  paidAt?: Date;
  dueDate?: Date;
  invoiceUrl?: string;
  createdAt: Date;
}

// Zod schemas
export const CreateCheckoutSessionSchema = z.object({
  planTier: z.nativeEnum(PlanTier),
  interval: z.enum(['month', 'year']).default('month'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponCode: z.string().optional(),
});

export const CancelSubscriptionSchema = z.object({
  immediately: z.boolean().default(false),
  reason: z.string().optional(),
});
