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

  async getEvents(
    tenantId: string,
    filters?: { userId?: string; eventType?: string },
    params?: { skip?: number; take?: number },
  ) {
    const where = {
      tenantId,
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.eventType && { eventType: filters.eventType }),
    };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 100,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { events, total, hasMore: (params?.skip || 0) + events.length < total };
  }
}
