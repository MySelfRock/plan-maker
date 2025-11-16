export enum WebhookEvent {
  // Plan events
  PLAN_CREATED = 'plan.created',
  PLAN_GENERATED = 'plan.generated',
  PLAN_UPDATED = 'plan.updated',
  PLAN_COMPLETED = 'plan.completed',

  // User events
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',

  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPGRADED = 'subscription.upgraded',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',
}

export interface WebhookPayload {
  event: WebhookEvent;
  tenantId: string;
  timestamp: Date;
  data: any;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  url: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastAttemptAt?: Date;
  status: 'pending' | 'delivered' | 'failed';
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
}
