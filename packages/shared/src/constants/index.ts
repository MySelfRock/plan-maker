/**
 * Shared Constants
 */

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256' as const,
};

export const RATE_LIMITS = {
  AUTH_PER_IP_PER_HOUR: 10,
  API_PER_USER_PER_MINUTE: 60,
  PLAN_GENERATION_PER_USER_PER_DAY: 5,
};

export const PLAN_LIMITS = {
  MAX_WEEKS: 52,
  MIN_WEEKS: 1,
  MAX_SESSIONS_PER_DAY: 3,
  MIN_SESSION_DURATION: 15, // minutes
  MAX_SESSION_DURATION: 180, // minutes
};

export const SUBSCRIPTION_TRIAL_DAYS = 14;

export const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES'] as const;

export const SUPPORTED_TIMEZONES = [
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
] as const;

export const NICHE_CONFIG = {
  fitness: {
    levels: ['beginner', 'intermediate', 'advanced', 'expert'],
    commonGoals: [
      'Lose weight',
      'Build muscle',
      'Increase endurance',
      'Improve flexibility',
      'General fitness',
    ],
    commonEquipment: [
      'Dumbbells',
      'Barbell',
      'Resistance bands',
      'Pull-up bar',
      'Treadmill',
      'Exercise bike',
      'Kettlebell',
      'Yoga mat',
    ],
  },
  music: {
    levels: ['beginner', 'intermediate', 'advanced', 'expert'],
    commonGoals: [
      'Learn instrument basics',
      'Improve technique',
      'Music theory',
      'Prepare for performance',
      'Songwriting',
    ],
    commonEquipment: [
      'Guitar',
      'Piano',
      'Drums',
      'Microphone',
      'Audio interface',
      'DAW software',
    ],
  },
  study: {
    levels: ['beginner', 'intermediate', 'advanced', 'expert'],
    commonGoals: [
      'Pass exam',
      'Learn new subject',
      'Improve grades',
      'Prepare for certification',
      'Research project',
    ],
    commonEquipment: [
      'Textbooks',
      'Computer',
      'Notebook',
      'Online courses',
    ],
  },
  skills: {
    levels: ['beginner', 'intermediate', 'advanced', 'expert'],
    commonGoals: [
      'Learn programming',
      'Improve communication',
      'Public speaking',
      'Time management',
      'Leadership',
    ],
    commonEquipment: [
      'Computer',
      'Books',
      'Online resources',
    ],
  },
} as const;

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  EMAIL_ALREADY_EXISTS: 'auth/email-already-exists',
  INVALID_TOKEN: 'auth/invalid-token',
  TOKEN_EXPIRED: 'auth/token-expired',

  // Tenant errors
  TENANT_NOT_FOUND: 'tenant/not-found',
  TENANT_SUSPENDED: 'tenant/suspended',
  TENANT_SLUG_TAKEN: 'tenant/slug-taken',

  // Plan errors
  PLAN_NOT_FOUND: 'plan/not-found',
  PLAN_GENERATION_FAILED: 'plan/generation-failed',
  PLAN_LIMIT_REACHED: 'plan/limit-reached',

  // Subscription errors
  SUBSCRIPTION_REQUIRED: 'subscription/required',
  SUBSCRIPTION_EXPIRED: 'subscription/expired',
  PAYMENT_FAILED: 'payment/failed',

  // General errors
  VALIDATION_ERROR: 'validation/error',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not-found',
  RATE_LIMIT_EXCEEDED: 'rate-limit/exceeded',
} as const;
