import { z } from 'zod';

/**
 * Plan, Session, and Exercise Types
 */

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum PlanType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  TWELVE_WEEK = '12-week',
  CUSTOM = 'custom',
}

export enum Intensity {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum SessionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export interface Exercise {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  niche: string;
  level: string;
  tags: string[];
  equipment: string[];
  duration?: number; // minutes
  sets?: number;
  reps?: number | string; // can be "10-12" or just 10
  intensity: Intensity;
  videoUrl?: string;
  imageUrl?: string;
  instructions?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionExercise {
  exerciseId: string;
  exercise?: Exercise; // populated
  sets?: number;
  reps?: number | string;
  duration?: number;
  notes?: string;
  order: number;
}

export interface Session {
  id: string;
  planDayId: string;
  title: string;
  description?: string;
  exercises: SessionExercise[];
  totalDuration: number; // minutes
  intensity: Intensity;
  status: SessionStatus;
  completedAt?: Date;
  feedback?: {
    rating?: number; // 1-5
    difficulty?: number; // 1-10
    notes?: string;
    metrics?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface PlanDay {
  id: string;
  planId: string;
  date: Date;
  weekday: string;
  sessions: Session[];
  isRestDay: boolean;
  notes?: string;
}

export interface Plan {
  id: string;
  userId: string;
  tenantId: string;
  profileId: string;
  name: string;
  type: PlanType;
  status: PlanStatus;
  version: number;
  startDate: Date;
  endDate?: Date;
  weeks?: number;
  days: PlanDay[];
  rationale?: string; // AI-generated explanation
  metadata?: Record<string, any>;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas
export const SessionExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.number().optional(),
  reps: z.union([z.number(), z.string()]).optional(),
  duration: z.number().optional(),
  notes: z.string().optional(),
  order: z.number(),
});

export const SessionFeedbackSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  difficulty: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  metrics: z.record(z.any()).optional(),
});

export const CreateSessionFeedbackSchema = SessionFeedbackSchema.required({
  rating: true,
});

export const GeneratePlanSchema = z.object({
  profileId: z.string().uuid(),
  type: z.nativeEnum(PlanType),
  startDate: z.string().or(z.date()),
  weeks: z.number().min(1).max(52).optional(),
  templateId: z.string().uuid().optional(),
  customInstructions: z.string().optional(),
});
