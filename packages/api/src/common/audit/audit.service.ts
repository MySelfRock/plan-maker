import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEvent, AuditEventType, AuditLogFilters, AuditSeverity } from './audit.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.event.create({
        data: {
          tenantId: event.tenantId,
          userId: event.userId,
          eventType: event.eventType,
          payload: {
            action: event.action,
            resourceType: event.resourceType,
            resourceId: event.resourceId,
            ...event.payload,
          },
          metadata: event.metadata,
          ipAddress: event.metadata?.ipAddress,
          userAgent: event.metadata?.userAgent,
        },
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Audit: ${event.eventType} - ${event.action} by user ${event.userId || 'system'}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${error.message}`, error.stack);
      // Don't throw - audit logging should not break application flow
    }
  }

  /**
   * Query audit logs
   */
  async query(tenantId: string, filters?: AuditLogFilters, pagination?: { skip?: number; take?: number }) {
    const where: any = { tenantId };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.eventType) {
      where.eventType = Array.isArray(filters.eventType)
        ? { in: filters.eventType }
        : filters.eventType;
    }

    if (filters?.resourceType) {
      where.payload = {
        path: ['resourceType'],
        equals: filters.resourceType,
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip: pagination?.skip || 0,
        take: pagination?.take || 100,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      events,
      total,
      hasMore: (pagination?.skip || 0) + events.length < total,
    };
  }

  // Convenience methods for common audit events

  async logUserAction(
    tenantId: string,
    userId: string,
    action: string,
    eventType: AuditEventType,
    metadata?: Record<string, any>,
  ) {
    await this.log({
      tenantId,
      userId,
      eventType,
      action,
      resourceType: 'user',
      resourceId: userId,
      payload: {},
      metadata,
    });
  }

  async logResourceChange(
    tenantId: string,
    userId: string | undefined,
    resourceType: string,
    resourceId: string,
    action: string,
    eventType: AuditEventType,
    changes?: { before?: any; after?: any },
  ) {
    await this.log({
      tenantId,
      userId,
      eventType,
      action,
      resourceType,
      resourceId,
      payload: {},
      metadata: { changes },
    });
  }

  async logSecurityEvent(
    tenantId: string,
    eventType: AuditEventType,
    action: string,
    metadata: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
      severity?: AuditSeverity;
    },
  ) {
    await this.log({
      tenantId,
      userId: metadata.userId,
      eventType,
      action,
      resourceType: 'security',
      payload: { reason: metadata.reason },
      metadata: {
        ...metadata,
        severity: metadata.severity || AuditSeverity.WARNING,
      },
    });
  }

  async logSystemEvent(
    tenantId: string,
    eventType: AuditEventType,
    action: string,
    payload: Record<string, any>,
    severity: AuditSeverity = AuditSeverity.INFO,
  ) {
    await this.log({
      tenantId,
      eventType,
      action,
      resourceType: 'system',
      payload,
      metadata: { severity },
    });
  }
}
