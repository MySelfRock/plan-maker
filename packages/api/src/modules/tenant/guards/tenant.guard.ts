import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TenantService } from '../tenant.service';

/**
 * Guard that resolves and injects tenant into request object
 * This should be applied globally or to protected routes
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantService: TenantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const hostname = request.get('host') || 'localhost';

    try {
      const tenant = await this.tenantService.resolveTenantFromHost(hostname);
      request.tenant = tenant; // inject tenant into request
      return true;
    } catch (error) {
      // If tenant resolution fails, we can either:
      // 1. Return false (block request)
      // 2. Throw the error (return 404/400)
      throw error;
    }
  }
}
