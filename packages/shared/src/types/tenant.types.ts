import { z } from 'zod';

/**
 * White-label Tenant Types
 * Represents a brand/organization using the platform
 */

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
  customCss?: string;
}

export interface TenantConfig {
  allowedNiches: string[]; // ['fitness', 'music', 'study']
  maxUsersPerPlan?: number;
  enabledFeatures: {
    oauth?: boolean;
    analytics?: boolean;
    customDomain?: boolean;
    api?: boolean;
    whiteLabel?: boolean;
  };
  emailSettings?: {
    fromName: string;
    fromEmail: string;
    replyTo?: string;
  };
  paymentSettings?: {
    stripeAccountId?: string;
    currency: string;
    allowedPlans: string[];
  };
}

export interface Tenant {
  id: string;
  slug: string; // unique identifier for subdomain/custom domain
  name: string;
  status: TenantStatus;
  theme: TenantTheme;
  config: TenantConfig;
  customDomain?: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptionTier?: string;
  billingEmail?: string;
}

// Zod schemas for validation
export const TenantThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  fontFamily: z.string().optional(),
  customCss: z.string().optional(),
});

export const TenantConfigSchema = z.object({
  allowedNiches: z.array(z.string()),
  maxUsersPerPlan: z.number().optional(),
  enabledFeatures: z.object({
    oauth: z.boolean().optional(),
    analytics: z.boolean().optional(),
    customDomain: z.boolean().optional(),
    api: z.boolean().optional(),
    whiteLabel: z.boolean().optional(),
  }),
  emailSettings: z.object({
    fromName: z.string(),
    fromEmail: z.string().email(),
    replyTo: z.string().email().optional(),
  }).optional(),
  paymentSettings: z.object({
    stripeAccountId: z.string().optional(),
    currency: z.string(),
    allowedPlans: z.array(z.string()),
  }).optional(),
});

export const CreateTenantSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  theme: TenantThemeSchema,
  config: TenantConfigSchema,
  customDomain: z.string().optional(),
  billingEmail: z.string().email().optional(),
});
