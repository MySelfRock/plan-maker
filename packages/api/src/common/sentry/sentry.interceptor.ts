import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { captureException, addBreadcrumb, setUser, setTag } from './sentry.config';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Set user context if available
    if (user) {
      setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    }

    // Set request tags
    setTag('http.method', method);
    setTag('http.url', url);

    // Add breadcrumb for the request
    addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      level: 'info',
      data: {
        method,
        url,
        query: request.query,
      },
    });

    return next.handle().pipe(
      tap(() => {
        // Add breadcrumb for successful response
        addBreadcrumb({
          category: 'http',
          message: `${method} ${url} - Success`,
          level: 'info',
        });
      }),
      catchError((error) => {
        // Don't capture expected HTTP exceptions (4xx errors)
        const shouldCapture = !(error instanceof HttpException && error.getStatus() < 500);

        if (shouldCapture) {
          captureException(error, {
            request: {
              method,
              url,
              query: request.query,
              body: this.sanitizeRequestBody(request.body),
            },
            user: user
              ? {
                  id: user.id,
                  email: user.email,
                }
              : undefined,
          });
        }

        return throwError(() => error);
      }),
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;

    const sanitized = { ...body };
    // Remove sensitive fields
    if (sanitized.password) sanitized.password = '[FILTERED]';
    if (sanitized.passwordHash) sanitized.passwordHash = '[FILTERED]';
    if (sanitized.token) sanitized.token = '[FILTERED]';

    return sanitized;
  }
}
