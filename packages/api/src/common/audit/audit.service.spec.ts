import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEventType, AuditSeverity } from './audit.types';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      const auditEvent = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        eventType: AuditEventType.USER_LOGIN,
        severity: AuditSeverity.INFO,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { success: true },
      };

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'log-1',
        ...auditEvent,
        timestamp: new Date(),
      });

      await service.log(auditEvent);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: auditEvent.tenantId,
          userId: auditEvent.userId,
          eventType: auditEvent.eventType,
          severity: auditEvent.severity,
          ipAddress: auditEvent.ipAddress,
          userAgent: auditEvent.userAgent,
          metadata: auditEvent.metadata,
        }),
      });
    });

    it('should log critical events with HIGH severity', async () => {
      const auditEvent = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        eventType: AuditEventType.USER_PASSWORD_RESET,
        severity: AuditSeverity.HIGH,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: {},
      };

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'log-1',
        ...auditEvent,
        timestamp: new Date(),
      });

      await service.log(auditEvent);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: AuditSeverity.HIGH,
        }),
      });
    });

    it('should handle metadata correctly', async () => {
      const metadata = {
        planId: 'plan-123',
        templateId: 'template-456',
        changes: ['name', 'description'],
      };

      const auditEvent = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        eventType: AuditEventType.PLAN_CREATED,
        severity: AuditSeverity.MEDIUM,
        metadata,
      };

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'log-1',
        ...auditEvent,
        timestamp: new Date(),
      });

      await service.log(auditEvent);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: metadata,
        }),
      });
    });
  });

  describe('query', () => {
    it('should query audit logs for tenant', async () => {
      const tenantId = 'tenant-1';
      const mockLogs = [
        {
          id: 'log-1',
          tenantId,
          userId: 'user-1',
          eventType: AuditEventType.USER_LOGIN,
          severity: AuditSeverity.INFO,
          timestamp: new Date(),
          metadata: {},
        },
        {
          id: 'log-2',
          tenantId,
          userId: 'user-1',
          eventType: AuditEventType.PLAN_CREATED,
          severity: AuditSeverity.MEDIUM,
          timestamp: new Date(),
          metadata: {},
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(2);

      const result = await service.query(tenantId);

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(2);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by userId', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.query(tenantId, { userId });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId, userId },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by eventType', async () => {
      const tenantId = 'tenant-1';
      const eventType = AuditEventType.USER_LOGIN;

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.query(tenantId, { eventType });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId, eventType },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by severity', async () => {
      const tenantId = 'tenant-1';
      const severity = AuditSeverity.HIGH;

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.query(tenantId, { severity });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId, severity },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by date range', async () => {
      const tenantId = 'tenant-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.query(tenantId, { startDate, endDate });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should support pagination', async () => {
      const tenantId = 'tenant-1';

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(100);

      await service.query(tenantId, { limit: 20, offset: 40 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { timestamp: 'desc' },
        take: 20,
        skip: 40,
      });
    });

    it('should combine multiple filters', async () => {
      const tenantId = 'tenant-1';
      const filters = {
        userId: 'user-1',
        eventType: AuditEventType.PLAN_CREATED,
        severity: AuditSeverity.MEDIUM,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 10,
        offset: 0,
      };

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.query(tenantId, filters);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          userId: filters.userId,
          eventType: filters.eventType,
          severity: filters.severity,
          timestamp: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        },
        orderBy: { timestamp: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      });
    });
  });
});
