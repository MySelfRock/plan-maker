import { AuditEventType } from './audit.types';

/**
 * Metadata key for audit configuration
 */
export const AUDIT_METADATA_KEY = Symbol('audit:config');

/**
 * Audit configuration
 */
export interface AuditConfig {
  eventType: AuditEventType | string;
  action: string;
  resourceType?: string;
  /**
   * Function to extract resource ID from method arguments or result
   */
  resourceIdExtractor?: (args: any[], result?: any) => string | undefined;
}

/**
 * Decorator to automatically audit method calls
 *
 * @example
 * class UserService {
 *   @Audit({
 *     eventType: AuditEventType.USER_CREATED,
 *     action: 'User created',
 *     resourceType: 'user',
 *     resourceIdExtractor: (args, result) => result.id
 *   })
 *   async createUser(data: CreateUserDto) {
 *     // ... create user
 *     return user;
 *   }
 * }
 */
export function Audit(config: AuditConfig): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Store audit config as metadata for potential interceptor use
    Reflect.defineMetadata(AUDIT_METADATA_KEY, config, target, propertyKey);

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Try to get AuditService and log the event
      try {
        // Access AuditService from the class instance
        const auditService = (this as any).auditService;

        if (auditService && typeof auditService.log === 'function') {
          // Extract context from args (assuming first arg might contain tenantId, userId, etc.)
          const context = args[0] || {};
          const tenantId = context.tenantId || (this as any).tenantId;
          const userId = context.userId || (this as any).userId;

          // Extract resource ID
          const resourceId = config.resourceIdExtractor
            ? config.resourceIdExtractor(args, result)
            : result?.id;

          await auditService.log({
            tenantId,
            userId,
            eventType: config.eventType,
            action: config.action,
            resourceType: config.resourceType,
            resourceId,
            payload: {
              method: propertyKey.toString(),
            },
          });
        }
      } catch (error) {
        // Silently fail - audit logging should not break the application
        console.warn(`Failed to log audit event for ${propertyKey.toString()}:`, error.message);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Convenience decorators for common audit scenarios
 */

export function AuditCreate(resourceType: string, action?: string): MethodDecorator {
  return Audit({
    eventType: `${resourceType}.created` as AuditEventType,
    action: action || `${resourceType} created`,
    resourceType,
    resourceIdExtractor: (args, result) => result?.id,
  });
}

export function AuditUpdate(resourceType: string, action?: string): MethodDecorator {
  return Audit({
    eventType: `${resourceType}.updated` as AuditEventType,
    action: action || `${resourceType} updated`,
    resourceType,
    resourceIdExtractor: (args) => args[0], // Assume first arg is ID
  });
}

export function AuditDelete(resourceType: string, action?: string): MethodDecorator {
  return Audit({
    eventType: `${resourceType}.deleted` as AuditEventType,
    action: action || `${resourceType} deleted`,
    resourceType,
    resourceIdExtractor: (args) => args[0], // Assume first arg is ID
  });
}
