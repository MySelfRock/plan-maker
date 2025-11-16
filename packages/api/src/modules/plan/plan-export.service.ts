import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlanExportService {
  private readonly logger = new Logger(PlanExportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Export plan as JSON
   */
  async exportAsJSON(planId: string): Promise<any> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        profile: {
          select: {
            niche: true,
            level: true,
            goals: true,
          },
        },
        template: {
          select: {
            name: true,
            description: true,
          },
        },
        days: {
          include: {
            sessions: {
              select: {
                id: true,
                title: true,
                description: true,
                exercises: true,
                totalDuration: true,
                intensity: true,
                status: true,
                completedAt: true,
              },
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }

    this.logger.log(`Exported plan ${planId} as JSON`);

    return {
      export: {
        format: 'json',
        version: '1.0',
        exportedAt: new Date().toISOString(),
      },
      plan: {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        status: plan.status,
        startDate: plan.startDate,
        weeks: plan.weeks,
        rationale: plan.rationale,
        profile: plan.profile,
        template: plan.template,
        schedule: plan.days.map((day) => ({
          date: day.date,
          weekday: day.weekday,
          isRestDay: day.isRestDay,
          sessions: day.sessions,
        })),
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
    };
  }

  /**
   * Export plan as simplified PDF-ready format
   * (In production, use a PDF library like pdfmake or puppeteer)
   */
  async exportAsPDFData(planId: string): Promise<any> {
    const jsonExport = await this.exportAsJSON(planId);
    const plan = jsonExport.plan;

    // Return PDF-ready data structure
    return {
      title: plan.name,
      metadata: {
        generatedAt: new Date().toISOString(),
        planType: plan.type,
        duration: `${plan.weeks} weeks`,
        startDate: plan.startDate,
      },
      profile: {
        niche: plan.profile.niche,
        level: plan.profile.level,
        goals: plan.profile.goals,
      },
      rationale: plan.rationale,
      schedule: plan.schedule.map((day, index) => ({
        dayNumber: index + 1,
        date: new Date(day.date).toLocaleDateString(),
        weekday: day.weekday,
        isRestDay: day.isRestDay,
        sessions: day.sessions.map((session) => ({
          title: session.title,
          description: session.description,
          duration: `${session.totalDuration} min`,
          intensity: session.intensity,
          exercises: session.exercises,
          completed: !!session.completedAt,
        })),
      })),
    };
  }

  /**
   * Export plan summary (lightweight format)
   */
  async exportSummary(planId: string): Promise<any> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        days: {
          include: {
            sessions: {
              select: {
                id: true,
                title: true,
                intensity: true,
                status: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }

    const totalSessions = plan.days.reduce((acc, day) => acc + day.sessions.length, 0);
    const completedSessions = plan.days.reduce(
      (acc, day) => acc + day.sessions.filter((s) => s.status === 'completed').length,
      0,
    );

    return {
      planId: plan.id,
      name: plan.name,
      type: plan.type,
      weeks: plan.weeks,
      status: plan.status,
      progress: {
        totalSessions,
        completedSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      },
      startDate: plan.startDate,
      createdAt: plan.createdAt,
    };
  }
}
