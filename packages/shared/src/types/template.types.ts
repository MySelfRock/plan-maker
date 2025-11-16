import { z } from 'zod';
import { Niche, Level } from './profile.types';

/**
 * Plan Template Types
 * Templates are created by admins and used to generate personalized plans
 */

export interface PlanRule {
  maxHighIntensityPerWeek?: number;
  minRestDays?: number;
  maxSessionsPerDay?: number;
  requiresProgressiveOverload?: boolean;
  muscleGroupRecoveryHours?: number;
  customRules?: string[]; // human-readable rules
}

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  niche: Niche;
  level: Level;
  type: string; // 'weekly', 'monthly', '12-week'
  weeks?: number;
  rules: PlanRule;
  sampleSessions?: any[]; // example sessions for AI context
  aiPromptTemplate: string; // template for AI prompt with placeholders
  isPublic: boolean; // can other tenants use this?
  createdBy: string; // user id
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas
export const PlanRuleSchema = z.object({
  maxHighIntensityPerWeek: z.number().optional(),
  minRestDays: z.number().optional(),
  maxSessionsPerDay: z.number().optional(),
  requiresProgressiveOverload: z.boolean().optional(),
  muscleGroupRecoveryHours: z.number().optional(),
  customRules: z.array(z.string()).optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string(),
  niche: z.nativeEnum(Niche),
  level: z.nativeEnum(Level),
  type: z.string(),
  weeks: z.number().optional(),
  rules: PlanRuleSchema,
  sampleSessions: z.array(z.any()).optional(),
  aiPromptTemplate: z.string(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();
