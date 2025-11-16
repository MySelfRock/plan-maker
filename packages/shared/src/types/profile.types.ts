import { z } from 'zod';

/**
 * User Profile and Onboarding Types
 */

export enum Niche {
  FITNESS = 'fitness',
  MUSIC = 'music',
  STUDY = 'study',
  SKILLS = 'skills',
  LANGUAGE = 'language',
  OTHER = 'other',
}

export enum Level {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface Availability {
  daysPerWeek: number;
  minutesPerDay: number;
  preferredDays?: string[]; // ['monday', 'wednesday', 'friday']
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface Profile {
  id: string;
  userId: string;
  tenantId: string;
  niche: Niche;
  level: Level;
  goals: string[]; // ['lose weight', 'build muscle', 'increase endurance']
  constraints: string[]; // ['knee injury', 'no jumping exercises']
  equipment: string[]; // ['dumbbells', 'resistance bands', 'pull-up bar']
  availability: Availability;
  allergies?: string;
  medicalNotes?: string;
  preferredSessionLength?: number; // minutes
  metadata?: Record<string, any>; // niche-specific data
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas
export const AvailabilitySchema = z.object({
  daysPerWeek: z.number().min(1).max(7),
  minutesPerDay: z.number().min(15).max(480),
  preferredDays: z.array(z.string()).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
});

export const CreateProfileSchema = z.object({
  niche: z.nativeEnum(Niche),
  level: z.nativeEnum(Level),
  goals: z.array(z.string()).min(1),
  constraints: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  availability: AvailabilitySchema,
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  preferredSessionLength: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const UpdateProfileSchema = CreateProfileSchema.partial();
