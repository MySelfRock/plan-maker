import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  // Don't initialize Sentry in development or if DSN is not set
  if (!dsn || environment === 'development') {
    console.log('Sentry not initialized (development mode or DSN not configured)');
    return;
  }

  Sentry.init({
    dsn,
    environment,

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10% by default

    // Profiling
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'), // 10% by default

    integrations: [
      nodeProfilingIntegration(),
      // HTTP instrumentation
      Sentry.httpIntegration({ tracing: true }),
      // Express instrumentation (NestJS uses Express under the hood)
      Sentry.expressIntegration(),
    ],

    // Release tracking
    release: process.env.SENTRY_RELEASE || 'unknown',

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove passwords from request data
      if (event.request?.data) {
        try {
          const data = JSON.parse(event.request.data);
          if (data.password) data.password = '[FILTERED]';
          if (data.passwordHash) data.passwordHash = '[FILTERED]';
          event.request.data = JSON.stringify(data);
        } catch (e) {
          // Ignore parse errors
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser errors
      'top.GLOBALS',
      // Network errors that are expected
      'NetworkError',
      'Network request failed',
      // Rate limit errors (expected behavior)
      'ThrottlerException',
    ],
  });

  console.log(`Sentry initialized for environment: ${environment}`);
}

// Helper to capture exception with context
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

// Helper to capture message
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Helper to add breadcrumb
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Helper to set user context
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

// Helper to set tag
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export { Sentry };
