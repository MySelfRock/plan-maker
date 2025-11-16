import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to inject current tenant into route handler
 * Usage: @CurrentTenant() tenant: Tenant
 */
export const CurrentTenant = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenant;
});
