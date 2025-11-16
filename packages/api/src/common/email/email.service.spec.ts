import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { RetryService } from '../retry/retry.service';

describe('EmailService', () => {
  let service: EmailService;
  let retryService: RetryService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        SMTP_USER: 'test@example.com',
        SMTP_PASSWORD: 'password',
        EMAIL_FROM: 'noreply@planmaker.io',
      };
      return config[key];
    }),
  };

  const mockRetryService = {
    executeWithRetry: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RetryService,
          useValue: mockRetryService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    retryService = module.get<RetryService>(RetryService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with retry', async () => {
      const email = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      mockRetryService.executeWithRetry.mockResolvedValue({
        result: { messageId: 'msg-123' },
        attempts: 1,
        totalDelay: 0,
      });

      await service.sendVerificationEmail(email, token, name);

      expect(mockRetryService.executeWithRetry).toHaveBeenCalled();

      const operation = mockRetryService.executeWithRetry.mock.calls[0][0];
      expect(typeof operation).toBe('function');
    });

    it('should include verification link in email', async () => {
      const email = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      let capturedMailOptions;
      mockRetryService.executeWithRetry.mockImplementation(async (operation) => {
        const transporter = {
          sendMail: jest.fn().mockImplementation((options) => {
            capturedMailOptions = options;
            return Promise.resolve({ messageId: 'msg-123' });
          }),
        };
        (service as any).transporter = transporter;
        return operation();
      });

      await service.sendVerificationEmail(email, token, name);

      expect(capturedMailOptions).toBeDefined();
      expect(capturedMailOptions.to).toBe(email);
      expect(capturedMailOptions.subject).toContain('Verify');
      expect(capturedMailOptions.html).toContain(token);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with retry', async () => {
      const email = 'user@example.com';
      const token = 'reset-token-123';
      const name = 'John Doe';

      mockRetryService.executeWithRetry.mockResolvedValue({
        result: { messageId: 'msg-123' },
        attempts: 1,
        totalDelay: 0,
      });

      await service.sendPasswordResetEmail(email, token, name);

      expect(mockRetryService.executeWithRetry).toHaveBeenCalled();
    });

    it('should include reset link in email', async () => {
      const email = 'user@example.com';
      const token = 'reset-token-123';
      const name = 'John Doe';

      let capturedMailOptions;
      mockRetryService.executeWithRetry.mockImplementation(async (operation) => {
        const transporter = {
          sendMail: jest.fn().mockImplementation((options) => {
            capturedMailOptions = options;
            return Promise.resolve({ messageId: 'msg-123' });
          }),
        };
        (service as any).transporter = transporter;
        return operation();
      });

      await service.sendPasswordResetEmail(email, token, name);

      expect(capturedMailOptions).toBeDefined();
      expect(capturedMailOptions.to).toBe(email);
      expect(capturedMailOptions.subject).toContain('Reset');
      expect(capturedMailOptions.html).toContain(token);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const email = 'user@example.com';
      const name = 'John Doe';

      mockRetryService.executeWithRetry.mockResolvedValue({
        result: { messageId: 'msg-123' },
        attempts: 1,
        totalDelay: 0,
      });

      await service.sendWelcomeEmail(email, name);

      expect(mockRetryService.executeWithRetry).toHaveBeenCalled();
    });

    it('should personalize welcome email with user name', async () => {
      const email = 'user@example.com';
      const name = 'John Doe';

      let capturedMailOptions;
      mockRetryService.executeWithRetry.mockImplementation(async (operation) => {
        const transporter = {
          sendMail: jest.fn().mockImplementation((options) => {
            capturedMailOptions = options;
            return Promise.resolve({ messageId: 'msg-123' });
          }),
        };
        (service as any).transporter = transporter;
        return operation();
      });

      await service.sendWelcomeEmail(email, name);

      expect(capturedMailOptions).toBeDefined();
      expect(capturedMailOptions.to).toBe(email);
      expect(capturedMailOptions.subject).toContain('Welcome');
      expect(capturedMailOptions.html).toContain(name);
    });
  });

  describe('retry behavior', () => {
    it('should retry on failure', async () => {
      const email = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      mockRetryService.executeWithRetry.mockResolvedValue({
        result: { messageId: 'msg-123' },
        attempts: 3,
        totalDelay: 3000,
      });

      await service.sendVerificationEmail(email, token, name);

      expect(mockRetryService.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxAttempts: expect.any(Number),
        }),
      );
    });

    it('should handle retry failure gracefully', async () => {
      const email = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      mockRetryService.executeWithRetry.mockRejectedValue(new Error('All retries failed'));

      await expect(service.sendVerificationEmail(email, token, name)).rejects.toThrow(
        'All retries failed',
      );
    });
  });

  describe('email configuration', () => {
    it('should use correct SMTP settings', () => {
      expect(configService.get).toHaveBeenCalledWith('SMTP_HOST');
      expect(configService.get).toHaveBeenCalledWith('SMTP_PORT');
      expect(configService.get).toHaveBeenCalledWith('SMTP_USER');
      expect(configService.get).toHaveBeenCalledWith('SMTP_PASSWORD');
    });

    it('should use correct sender address', async () => {
      const email = 'user@example.com';
      const name = 'John Doe';

      let capturedMailOptions;
      mockRetryService.executeWithRetry.mockImplementation(async (operation) => {
        const transporter = {
          sendMail: jest.fn().mockImplementation((options) => {
            capturedMailOptions = options;
            return Promise.resolve({ messageId: 'msg-123' });
          }),
        };
        (service as any).transporter = transporter;
        return operation();
      });

      await service.sendWelcomeEmail(email, name);

      expect(capturedMailOptions.from).toBe('noreply@planmaker.io');
    });
  });
});
