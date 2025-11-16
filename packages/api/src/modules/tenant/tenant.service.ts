import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Find tenant by slug (subdomain or custom identifier)
   * Cached for 5 minutes since tenant config rarely changes
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    const cacheKey = `tenant:slug:${slug}`;
    const cached = await this.cacheManager.get<Tenant>(cacheKey);

    if (cached) {
      return cached;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (tenant) {
      await this.cacheManager.set(cacheKey, tenant, 300000); // 5 minutes
    }

    return tenant;
  }

  /**
   * Find tenant by custom domain
   * Cached for 5 minutes
   */
  async findByCustomDomain(domain: string): Promise<Tenant | null> {
    const cacheKey = `tenant:domain:${domain}`;
    const cached = await this.cacheManager.get<Tenant>(cacheKey);

    if (cached) {
      return cached;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { customDomain: domain },
    });

    if (tenant) {
      await this.cacheManager.set(cacheKey, tenant, 300000); // 5 minutes
    }

    return tenant;
  }

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Resolve tenant from hostname (subdomain or custom domain)
   */
  async resolveTenantFromHost(hostname: string): Promise<Tenant> {
    // First, try custom domain
    let tenant = await this.findByCustomDomain(hostname);

    if (!tenant) {
      // Extract slug from subdomain (e.g., demo.planmaker.com -> demo)
      const slug = this.extractSlugFromHostname(hostname);
      if (slug) {
        tenant = await this.findBySlug(slug);
      }
    }

    // Fallback to default tenant in development
    if (!tenant && process.env.NODE_ENV === 'development') {
      const defaultSlug = process.env.DEFAULT_TENANT_SLUG || 'demo';
      tenant = await this.findBySlug(defaultSlug);
    }

    if (!tenant) {
      throw new NotFoundException('Tenant not found for this domain');
    }

    // Check if tenant is suspended
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      throw new BadRequestException('This tenant account is suspended');
    }

    return tenant;
  }

  /**
   * Extract tenant slug from hostname
   * Examples:
   * - demo.planmaker.com -> demo
   * - demo.planmaker.local -> demo
   * - localhost -> null (use default)
   */
  private extractSlugFromHostname(hostname: string): string | null {
    // Remove port if present
    hostname = hostname.split(':')[0];

    // For localhost, return null (will use default)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }

    // For subdomains
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // first part is the slug
    }

    return null;
  }

  /**
   * Create new tenant (admin only)
   */
  async create(data: {
    slug: string;
    name: string;
    theme: any;
    config: any;
    customDomain?: string;
    billingEmail?: string;
  }): Promise<Tenant> {
    // Check if slug is already taken
    const existing = await this.findBySlug(data.slug);
    if (existing) {
      throw new BadRequestException('Tenant slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        ...data,
        status: 'trial', // new tenants start with trial
      },
    });
  }

  /**
   * Update tenant
   * Invalidates cache on update
   */
  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await this.cacheManager.del(`tenant:slug:${tenant.slug}`);
    if (tenant.customDomain) {
      await this.cacheManager.del(`tenant:domain:${tenant.customDomain}`);
    }

    return tenant;
  }

  /**
   * List all tenants (super admin only)
   */
  async findAll(params?: { skip?: number; take?: number }): Promise<{ tenants: Tenant[]; total: number }> {
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip: params?.skip || 0,
        take: params?.take || 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);

    return { tenants, total };
  }

  /**
   * Delete tenant (super admin only, dangerous!)
   * Invalidates cache on delete
   */
  async delete(id: string): Promise<void> {
    const tenant = await this.findById(id);

    await this.prisma.tenant.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cacheManager.del(`tenant:slug:${tenant.slug}`);
    if (tenant.customDomain) {
      await this.cacheManager.del(`tenant:domain:${tenant.customDomain}`);
    }
  }
}
