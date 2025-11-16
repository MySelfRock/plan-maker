import { Test, TestingModule } from '@nestjs/testing';
import { RetryService } from './retry.service';
import { RetryPolicies } from './retry.interface';

describe('RetryService', () => {
  let service: RetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetryService],
    }).compile();

    service = module.get<RetryService>(RetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await service.executeWithRetry(operation);

    expect(result.result).toBe('success');
    expect(result.attempts).toBe(1);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await service.executeWithRetry(operation, RetryPolicies.FAST);

    expect(result.result).toBe('success');
    expect(result.attempts).toBe(3);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      service.executeWithRetry(operation, { maxAttempts: 2, initialDelay: 10 }),
    ).rejects.toThrow('always fails');

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should respect shouldRetry predicate', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('non-retryable'));

    await expect(
      service.executeWithRetry(operation, {
        maxAttempts: 3,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('non-retryable');

    expect(operation).toHaveBeenCalledTimes(1);
  });
});
