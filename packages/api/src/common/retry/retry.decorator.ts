import { RetryOptions } from './retry.interface';

/**
 * Metadata key for retry options
 */
export const RETRY_OPTIONS_METADATA = Symbol('retry:options');

/**
 * Decorator to add retry logic to a method
 *
 * @example
 * class MyService {
 *   @Retry({ maxAttempts: 3, initialDelay: 1000 })
 *   async callExternalAPI() {
 *     // This method will be retried up to 3 times with exponential backoff
 *   }
 * }
 *
 * @example Using predefined policies
 * import { RetryPolicies } from './retry.interface';
 *
 * class MyService {
 *   @Retry(RetryPolicies.NETWORK)
 *   async fetchData() {
 *     // Retries with NETWORK policy (4 attempts, 2s-16s)
 *   }
 * }
 */
export function Retry(options: RetryOptions = {}): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // Store retry options as metadata (for future interceptor-based implementation)
    Reflect.defineMetadata(RETRY_OPTIONS_METADATA, options, target, propertyKey);

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Import RetryService dynamically to avoid circular dependency
      const { RetryService } = await import('./retry.service');
      const retryService = new RetryService();

      // Execute with retry
      const { result } = await retryService.executeWithRetry(
        () => originalMethod.apply(this, args),
        options,
      );

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator for critical operations (5 attempts, 2s-60s)
 */
export function RetryCritical(): MethodDecorator {
  const { RetryPolicies } = require('./retry.interface');
  return Retry(RetryPolicies.CRITICAL);
}

/**
 * Decorator for standard operations (3 attempts, 1s-10s)
 */
export function RetryStandard(): MethodDecorator {
  const { RetryPolicies } = require('./retry.interface');
  return Retry(RetryPolicies.STANDARD);
}

/**
 * Decorator for fast operations (3 attempts, 500ms-5s)
 */
export function RetryFast(): MethodDecorator {
  const { RetryPolicies } = require('./retry.interface');
  return Retry(RetryPolicies.FAST);
}

/**
 * Decorator for network operations (4 attempts, 2s-16s)
 */
export function RetryNetwork(): MethodDecorator {
  const { RetryPolicies } = require('./retry.interface');
  return Retry(RetryPolicies.NETWORK);
}

/**
 * Decorator for database operations (3 attempts, 100ms-1s)
 */
export function RetryDatabase(): MethodDecorator {
  const { RetryPolicies } = require('./retry.interface');
  return Retry(RetryPolicies.DATABASE);
}
