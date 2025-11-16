import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async logEvent(data: {
    tenantId: string;
    userId?: string;
    eventType: string;
    payload: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.event.create({
      data,
    });
  }

  async getEvents(tenantId: string, filters?: { userId?: string; eventType?: string; limit?: number }) {
    return this.prisma.event.findMany({
      where: {
        tenantId,
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.eventType && { eventType: filters.eventType }),
      },
      take: filters?.limit || 100,
      orderBy: { timestamp: 'desc' },
    });
  }
}
