import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  errorCode?: string;
  details?: any;
  stack?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const errorResponse = this.getErrorResponse(exception, request, status);

    // Log error for monitoring
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status}: ${errorResponse.message}`);
    }

    // Send response
    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorResponse(exception: unknown, request: Request, status: number): ErrorResponse {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    const baseResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        baseResponse.message = exceptionResponse;
        baseResponse.error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        baseResponse.message = response.message || exception.message;
        baseResponse.error = response.error || exception.name;
        baseResponse.errorCode = response.errorCode;
        baseResponse.details = response.details;
      }
    } else if (exception instanceof Error) {
      baseResponse.message = isProduction ? 'Internal server error' : exception.message;
      baseResponse.error = exception.name;

      // Include stack trace in development
      if (!isProduction && exception.stack) {
        baseResponse.stack = exception.stack;
      }
    }

    return baseResponse;
  }
}
