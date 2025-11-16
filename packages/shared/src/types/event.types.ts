import { z } from 'zod';

/**
 * Analytics and Event Tracking Types
 */

export enum EventType {
  // User events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_UPDATED = 'user.updated',

  // Profile events
  PROFILE_CREATED = 'profile.created',
  PROFILE_UPDATED = 'profile.updated',
  ONBOARDING_COMPLETED = 'onboarding.completed',

  // Plan events
  PLAN_GENERATED = 'plan.generated',
  PLAN_REGENERATED = 'plan.regenerated',
  PLAN_STARTED = 'plan.started',
  PLAN_PAUSED = 'plan.paused',
  PLAN_COMPLETED = 'plan.completed',

  // Session events
  SESSION_STARTED = 'session.started',
  SESSION_COMPLETED = 'session.completed',
  SESSION_SKIPPED = 'session.skipped',
  SESSION_FEEDBACK = 'session.feedback',

  // Payment events
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',

  // Export events
  PLAN_EXPORTED_PDF = 'plan.exported.pdf',
  PLAN_SHARED = 'plan.shared',

  // Admin events
  TEMPLATE_CREATED = 'template.created',
  TEMPLATE_UPDATED = 'template.updated',
  EXERCISE_CREATED = 'exercise.created',

  // API events
  API_REQUEST = 'api.request',
  API_ERROR = 'api.error',
}

export interface Event {
  id: string;
  tenantId: string;
  userId?: string;
  eventType: EventType;
  payload: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Zod schema
export const CreateEventSchema = z.object({
  eventType: z.nativeEnum(EventType),
  payload: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
});
