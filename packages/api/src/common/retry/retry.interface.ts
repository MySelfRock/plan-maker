export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 30000 (30 seconds)
   */
  maxDelay?: number;

  /**
   * Exponential backoff multiplier
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Whether to add jitter (randomness) to delay
   * Helps prevent thundering herd problem
   * @default true
   */
  useJitter?: boolean;

  /**
   * Custom function to determine if error should trigger retry
   * @default retries on all errors
   */
  shouldRetry?: (error: any) => boolean;

  /**
   * Callback executed before each retry attempt
   */
  onRetry?: (attempt: number, error: any, delay: number) => void;
}

export interface RetryResult<T> {
  /**
   * The successful result
   */
  result: T;

  /**
   * Number of attempts made
   */
  attempts: number;

  /**
   * Total time spent (including delays) in milliseconds
   */
  totalTime: number;
}

/**
 * Predefined retry policies for common scenarios
 */
export const RetryPolicies = {
  /**
   * Conservative policy for critical operations
   * 5 attempts, starts at 2s, max 60s
   */
  CRITICAL: {
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    useJitter: true,
  },

  /**
   * Standard policy for external API calls
   * 3 attempts, starts at 1s, max 10s
   */
  STANDARD: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    useJitter: true,
  },

  /**
   * Fast retry for quick operations
   * 3 attempts, starts at 500ms, max 5s
   */
  FAST: {
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    useJitter: true,
  },

  /**
   * Network-related retries (DNS, connection)
   * 4 attempts, starts at 2s, max 16s
   */
  NETWORK: {
    maxAttempts: 4,
    initialDelay: 2000,
    maxDelay: 16000,
    backoffMultiplier: 2,
    useJitter: true,
  },

  /**
   * Database-related retries
   * 3 attempts, starts at 100ms, max 1s
   */
  DATABASE: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    useJitter: false,
  },
} as const;

/**
 * Common error predicates
 */
export const ErrorPredicates = {
  /**
   * Retry on network errors
   */
  isNetworkError: (error: any): boolean => {
    return (
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET' ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout')
    );
  },

  /**
   * Retry on rate limit errors (429, 503)
   */
  isRateLimitError: (error: any): boolean => {
    return error?.response?.status === 429 || error?.response?.status === 503;
  },

  /**
   * Retry on server errors (5xx)
   */
  isServerError: (error: any): boolean => {
    const status = error?.response?.status || error?.status;
    return status >= 500 && status < 600;
  },

  /**
   * Retry on transient errors (network, rate limit, server errors)
   */
  isTransientError: (error: any): boolean => {
    return (
      ErrorPredicates.isNetworkError(error) ||
      ErrorPredicates.isRateLimitError(error) ||
      ErrorPredicates.isServerError(error)
    );
  },

  /**
   * Don't retry on client errors (4xx except 429)
   */
  isNotClientError: (error: any): boolean => {
    const status = error?.response?.status || error?.status;
    return !status || status < 400 || status >= 500 || status === 429;
  },
};
