import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  INVALID_CREDENTIALS = 'AUTH_1001',
  TOKEN_EXPIRED = 'AUTH_1002',
  TOKEN_INVALID = 'AUTH_1003',
  UNAUTHORIZED_ACCESS = 'AUTH_1004',
  INSUFFICIENT_PERMISSIONS = 'AUTH_1005',

  // User Management (2xxx)
  USER_NOT_FOUND = 'USER_2001',
  USER_ALREADY_EXISTS = 'USER_2002',
  EMAIL_NOT_VERIFIED = 'USER_2003',
  INVALID_EMAIL = 'USER_2004',
  WEAK_PASSWORD = 'USER_2005',

  // Plan Generation (3xxx)
  PLAN_NOT_FOUND = 'PLAN_3001',
  PLAN_GENERATION_FAILED = 'PLAN_3002',
  INVALID_PROFILE = 'PLAN_3003',
  TEMPLATE_NOT_FOUND = 'PLAN_3004',
  PLAN_ALREADY_ACTIVE = 'PLAN_3005',

  // Template Management (4xxx)
  TEMPLATE_NOT_FOUND = 'TMPL_4001',
  TEMPLATE_VALIDATION_FAILED = 'TMPL_4002',
  VERSION_NOT_FOUND = 'TMPL_4003',
  CANNOT_DELETE_PUBLIC_TEMPLATE = 'TMPL_4004',

  // Subscription & Payment (5xxx)
  SUBSCRIPTION_NOT_FOUND = 'SUB_5001',
  PAYMENT_FAILED = 'SUB_5002',
  SUBSCRIPTION_EXPIRED = 'SUB_5003',
  PLAN_LIMIT_REACHED = 'SUB_5004',

  // External Services (6xxx)
  AI_SERVICE_ERROR = 'EXT_6001',
  EMAIL_SERVICE_ERROR = 'EXT_6002',
  STORAGE_SERVICE_ERROR = 'EXT_6003',
  WEBHOOK_DELIVERY_FAILED = 'EXT_6004',

  // Validation (7xxx)
  VALIDATION_ERROR = 'VAL_7001',
  INVALID_INPUT = 'VAL_7002',
  MISSING_REQUIRED_FIELD = 'VAL_7003',

  // General (9xxx)
  INTERNAL_ERROR = 'GEN_9001',
  RESOURCE_NOT_FOUND = 'GEN_9002',
  OPERATION_FAILED = 'GEN_9003',
}

export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: any,
  ) {
    super(
      {
        message,
        errorCode,
        details,
        error: 'Business Logic Error',
      },
      statusCode,
    );
  }
}

// Specific exception classes for common cases
export class AuthenticationException extends BusinessException {
  constructor(message = 'Authentication failed', details?: any) {
    super(message, ErrorCode.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED, details);
  }
}

export class AuthorizationException extends BusinessException {
  constructor(message = 'Insufficient permissions', details?: any) {
    super(message, ErrorCode.INSUFFICIENT_PERMISSIONS, HttpStatus.FORBIDDEN, details);
  }
}

export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

export class PlanGenerationException extends BusinessException {
  constructor(message = 'Plan generation failed', details?: any) {
    super(message, ErrorCode.PLAN_GENERATION_FAILED, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

export class ExternalServiceException extends BusinessException {
  constructor(service: string, details?: any) {
    super(
      `External service error: ${service}`,
      ErrorCode.AI_SERVICE_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
      details,
    );
  }
}

export class ValidationException extends BusinessException {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, details);
  }
}
