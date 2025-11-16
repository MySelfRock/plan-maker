/**
 * Audit Event Types
 * Categorized by domain for better organization
 */
export enum AuditEventType {
  // Authentication
  USER_LOGIN = 'auth.user.login',
  USER_LOGOUT = 'auth.user.logout',
  USER_REGISTER = 'auth.user.register',
  USER_EMAIL_VERIFIED = 'auth.user.email_verified',
  PASSWORD_RESET_REQUESTED = 'auth.password.reset_requested',
  PASSWORD_RESET_COMPLETED = 'auth.password.reset_completed',
  PASSWORD_CHANGED = 'auth.password.changed',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',

  // Plan Management
  PLAN_CREATED = 'plan.created',
  PLAN_GENERATED = 'plan.generated',
  PLAN_UPDATED = 'plan.updated',
  PLAN_DELETED = 'plan.deleted',
  PLAN_EXPORTED = 'plan.exported',

  // Template Management
  TEMPLATE_CREATED = 'template.created',
  TEMPLATE_UPDATED = 'template.updated',
  TEMPLATE_DELETED = 'template.deleted',
  TEMPLATE_PUBLISHED = 'template.published',

  // Subscription & Billing
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPGRADED = 'subscription.upgraded',
  SUBSCRIPTION_DOWNGRADED = 'subscription.downgraded',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',

  // Tenant Management
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_DELETED = 'tenant.deleted',
  TENANT_SETTINGS_CHANGED = 'tenant.settings_changed',

  // Security
  ACCESS_DENIED = 'security.access_denied',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  INVALID_TOKEN = 'security.invalid_token',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',

  // Admin Actions
  ADMIN_ACTION = 'admin.action',
  ADMIN_USER_IMPERSONATION = 'admin.user_impersonation',
  ADMIN_DATA_EXPORT = 'admin.data_export',

  // System
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  API_KEY_CREATED = 'system.api_key_created',
  API_KEY_REVOKED = 'system.api_key_revoked',
}

/**
 * Audit Event Severity
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Audit Event Interface
 */
export interface AuditEvent {
  tenantId: string;
  userId?: string;
  eventType: AuditEventType | string;
  action: string; // Human-readable action (e.g., "User logged in")
  resourceType?: string; // e.g., "user", "plan", "template"
  resourceId?: string;
  payload: Record<string, any>;
  metadata?: {
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
    changes?: {
      before?: Record<string, any>;
      after?: Record<string, any>;
    };
    [key: string]: any;
  };
}

/**
 * Audit Log Filters
 */
export interface AuditLogFilters {
  userId?: string;
  eventType?: string | string[];
  resourceType?: string;
  resourceId?: string;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
}
