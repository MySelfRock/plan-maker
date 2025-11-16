import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryService } from '../../common/retry/retry.service';
import { RetryPolicies } from '../../common/retry/retry.interface';
import { WebhookEvent, WebhookPayload } from './webhook.types';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private webhookSubscriptions: Map<string, Set<{ url: string; secret: string; events: WebhookEvent[] }>>;

  constructor(
    private configService: ConfigService,
    private retryService: RetryService,
  ) {
    // In production, this would be stored in database
    this.webhookSubscriptions = new Map();
  }

  /**
   * Register a webhook endpoint for a tenant
   */
  async register(tenantId: string, url: string, events: WebhookEvent[], secret?: string): Promise<string> {
    if (!this.webhookSubscriptions.has(tenantId)) {
      this.webhookSubscriptions.set(tenantId, new Set());
    }

    const webhookSecret = secret || this.generateSecret();

    this.webhookSubscriptions.get(tenantId)!.add({
      url,
      secret: webhookSecret,
      events,
    });

    this.logger.log(`Webhook registered for tenant ${tenantId}: ${url}`);
    return webhookSecret;
  }

  /**
   * Trigger a webhook event
   */
  async trigger(tenantId: string, event: WebhookEvent, data: any): Promise<void> {
    const subscriptions = this.webhookSubscriptions.get(tenantId);

    if (!subscriptions || subscriptions.size === 0) {
      this.logger.debug(`No webhook subscriptions for tenant ${tenantId}`);
      return;
    }

    const payload: WebhookPayload = {
      event,
      tenantId,
      timestamp: new Date(),
      data,
    };

    // Trigger all matching webhooks
    const promises = Array.from(subscriptions)
      .filter((sub) => sub.events.includes(event))
      .map((sub) => this.deliver(sub.url, sub.secret, payload));

    await Promise.allSettled(promises);
  }

  /**
   * Deliver webhook payload to endpoint
   */
  private async deliver(url: string, secret: string, payload: WebhookPayload): Promise<void> {
    const signature = this.generateSignature(payload, secret);

    try {
      await this.retryService.executeWithRetry(
        async () => {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': payload.event,
              'User-Agent': 'PlanMaker-Webhooks/1.0',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
          }

          this.logger.log(`Webhook delivered successfully to ${url}`);
          return response;
        },
        {
          ...RetryPolicies.NETWORK,
          onRetry: (attempt, error, delay) => {
            this.logger.warn(
              `Webhook delivery to ${url} failed (attempt ${attempt}): ${error.message}. Retrying in ${delay}ms...`,
            );
          },
        },
      );
    } catch (error) {
      this.logger.error(`Webhook delivery to ${url} failed after retries: ${error.message}`);
      // In production, you might want to store failed deliveries for manual retry
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Generate a random webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: WebhookPayload, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Unregister a webhook
   */
  async unregister(tenantId: string, url: string): Promise<void> {
    const subscriptions = this.webhookSubscriptions.get(tenantId);

    if (subscriptions) {
      const toRemove = Array.from(subscriptions).find((sub) => sub.url === url);
      if (toRemove) {
        subscriptions.delete(toRemove);
        this.logger.log(`Webhook unregistered for tenant ${tenantId}: ${url}`);
      }
    }
  }

  /**
   * Get all webhooks for a tenant
   */
  async list(tenantId: string): Promise<{ url: string; events: WebhookEvent[] }[]> {
    const subscriptions = this.webhookSubscriptions.get(tenantId);

    if (!subscriptions) {
      return [];
    }

    return Array.from(subscriptions).map((sub) => ({
      url: sub.url,
      events: sub.events,
    }));
  }
}
