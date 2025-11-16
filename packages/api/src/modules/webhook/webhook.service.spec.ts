import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from './webhook.service';
import { RetryService } from '../../common/retry/retry.service';
import { WebhookEvent } from './webhook.types';

describe('WebhookService', () => {
  let service: WebhookService;
  let retryService: RetryService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: RetryService,
          useValue: {
            executeWithRetry: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    retryService = module.get<RetryService>(RetryService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new webhook', async () => {
      const tenantId = 'tenant-1';
      const url = 'https://example.com/webhook';
      const events = [WebhookEvent.PLAN_CREATED];

      const secret = await service.register(tenantId, url, events);

      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should accept custom secret', async () => {
      const tenantId = 'tenant-1';
      const url = 'https://example.com/webhook';
      const events = [WebhookEvent.PLAN_CREATED];
      const customSecret = 'my-custom-secret';

      const secret = await service.register(tenantId, url, events, customSecret);

      expect(secret).toBe(customSecret);
    });
  });

  describe('trigger', () => {
    it('should trigger webhooks for matching events', async () => {
      const tenantId = 'tenant-1';
      const url = 'https://example.com/webhook';
      const events = [WebhookEvent.PLAN_CREATED, WebhookEvent.USER_REGISTERED];

      jest.spyOn(retryService, 'executeWithRetry').mockResolvedValue({
        result: { ok: true },
        attempts: 1,
        totalDelay: 0,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await service.register(tenantId, url, events);
      await service.trigger(tenantId, WebhookEvent.PLAN_CREATED, { planId: '123' });

      expect(retryService.executeWithRetry).toHaveBeenCalled();
    });

    it('should not trigger webhook for non-matching events', async () => {
      const tenantId = 'tenant-1';
      const url = 'https://example.com/webhook';
      const events = [WebhookEvent.PLAN_CREATED];

      jest.spyOn(retryService, 'executeWithRetry').mockResolvedValue({
        result: { ok: true },
        attempts: 1,
        totalDelay: 0,
      });

      await service.register(tenantId, url, events);
      await service.trigger(tenantId, WebhookEvent.USER_REGISTERED, { userId: '456' });

      expect(retryService.executeWithRetry).not.toHaveBeenCalled();
    });

    it('should handle tenant with no subscriptions', async () => {
      const tenantId = 'tenant-without-webhooks';

      await expect(
        service.trigger(tenantId, WebhookEvent.PLAN_CREATED, {}),
      ).resolves.not.toThrow();
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = {
        event: WebhookEvent.PLAN_CREATED,
        tenantId: 'tenant-1',
        timestamp: new Date(),
        data: { planId: '123' },
      };
      const secret = 'test-secret';

      // Generate signature using the private method (we'll access it through the service)
      const signature = (service as any).generateSignature(payload, secret);

      const isValid = service.verifySignature(payload, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = {
        event: WebhookEvent.PLAN_CREATED,
        tenantId: 'tenant-1',
        timestamp: new Date(),
        data: { planId: '123' },
      };
      const secret = 'test-secret';
      const wrongSignature = 'sha256=wrongsignature0123456789abcdef';

      const isValid = service.verifySignature(payload, wrongSignature, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should unregister a webhook', async () => {
      const tenantId = 'tenant-1';
      const url = 'https://example.com/webhook';
      const events = [WebhookEvent.PLAN_CREATED];

      await service.register(tenantId, url, events);
      await service.unregister(tenantId, url);

      const webhooks = await service.list(tenantId);
      expect(webhooks.length).toBe(0);
    });

    it('should handle unregistering non-existent webhook', async () => {
      const tenantId = 'tenant-1';
      const url = 'https://example.com/webhook';

      await expect(service.unregister(tenantId, url)).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    it('should list all webhooks for tenant', async () => {
      const tenantId = 'tenant-1';
      const url1 = 'https://example.com/webhook1';
      const url2 = 'https://example.com/webhook2';
      const events = [WebhookEvent.PLAN_CREATED];

      await service.register(tenantId, url1, events);
      await service.register(tenantId, url2, events);

      const webhooks = await service.list(tenantId);

      expect(webhooks.length).toBe(2);
      expect(webhooks[0].url).toBeDefined();
      expect(webhooks[0].events).toEqual(events);
    });

    it('should return empty array for tenant with no webhooks', async () => {
      const tenantId = 'tenant-without-webhooks';

      const webhooks = await service.list(tenantId);

      expect(webhooks).toEqual([]);
    });
  });
});
