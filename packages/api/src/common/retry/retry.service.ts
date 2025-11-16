import { Injectable, Logger } from '@nestjs/common';
import { RetryOptions, RetryResult, RetryPolicies } from './retry.interface';

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<RetryResult<T>> {
    const config = this.mergeWithDefaults(options);
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        const totalTime = Date.now() - startTime;

        if (attempt > 1) {
          this.logger.log(
            `Operation succeeded on attempt ${attempt}/${config.maxAttempts} (${totalTime}ms total)`,
          );
        }

        return {
          result,
          attempts: attempt,
          totalTime,
        };
      } catch (error) {
        lastError = error;

        // Check if we should retry this error
        if (config.shouldRetry && !config.shouldRetry(error)) {
          this.logger.warn(
            `Error not retryable: ${error.message}. Aborting after ${attempt} attempts.`,
          );
          throw error;
        }

        // Don't retry if this was the last attempt
        if (attempt >= config.maxAttempts) {
          this.logger.error(
            `Operation failed after ${config.maxAttempts} attempts: ${error.message}`,
          );
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);

        // Execute onRetry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt, error, delay);
        }

        this.logger.warn(
          `Attempt ${attempt}/${config.maxAttempts} failed: ${error.message}. ` +
            `Retrying in ${delay}ms...`,
        );

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    // Exponential backoff: initialDelay * (backoffMultiplier ^ (attempt - 1))
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);

    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled (randomness to prevent thundering herd)
    if (config.useJitter) {
      // Random value between 0.5 and 1.5 of the calculated delay
      const jitter = 0.5 + Math.random();
      delay = Math.floor(delay * jitter);
    }

    return delay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Merge user options with defaults
   */
  private mergeWithDefaults(options: RetryOptions): Required<RetryOptions> {
    const defaults = RetryPolicies.STANDARD;

    return {
      maxAttempts: options.maxAttempts ?? defaults.maxAttempts,
      initialDelay: options.initialDelay ?? defaults.initialDelay,
      maxDelay: options.maxDelay ?? defaults.maxDelay,
      backoffMultiplier: options.backoffMultiplier ?? defaults.backoffMultiplier,
      useJitter: options.useJitter ?? defaults.useJitter,
      shouldRetry: options.shouldRetry ?? (() => true),
      onRetry: options.onRetry ?? (() => {}),
    };
  }

  /**
   * Helper: Retry with CRITICAL policy
   */
  async critical<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, RetryPolicies.CRITICAL);
  }

  /**
   * Helper: Retry with STANDARD policy
   */
  async standard<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, RetryPolicies.STANDARD);
  }

  /**
   * Helper: Retry with FAST policy
   */
  async fast<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, RetryPolicies.FAST);
  }

  /**
   * Helper: Retry with NETWORK policy
   */
  async network<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, RetryPolicies.NETWORK);
  }

  /**
   * Helper: Retry with DATABASE policy
   */
  async database<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, RetryPolicies.DATABASE);
  }
}
