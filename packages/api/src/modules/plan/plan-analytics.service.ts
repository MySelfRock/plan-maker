import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlanAnalyticsService {
  private readonly logger = new Logger(PlanAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user plan statistics
   */
  async getUserStats(userId: string) {
    const plans = await this.prisma.plan.findMany({
      where: { userId },
      include: {
        days: {
          include: {
            sessions: {
              select: {
                status: true,
                completedAt: true,
                feedback: true,
              },
            },
          },
        },
      },
    });

    const totalPlans = plans.length;
    const activePlans = plans.filter((p) => p.status === 'active').length;
    const completedPlans = plans.filter((p) => p.status === 'completed').length;

    let totalSessions = 0;
    let completedSessions = 0;
    let totalRating = 0;
    let ratingCount = 0;

    plans.forEach((plan) => {
      plan.days.forEach((day) => {
        totalSessions += day.sessions.length;
        day.sessions.forEach((session) => {
          if (session.status === 'completed') {
            completedSessions++;
            if (session.feedback?.rating) {
              totalRating += session.feedback.rating;
              ratingCount++;
            }
          }
        });
      });
    });

    return {
      userId,
      plans: {
        total: totalPlans,
        active: activePlans,
        completed: completedPlans,
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      },
      satisfaction: {
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        totalRatings: ratingCount,
      },
    };
  }

  /**
   * Get tenant-wide analytics
   */
  async getTenantStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalUsers, totalPlans, activeSubscriptions] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.plan.count({ where }),
      this.prisma.subscription.count({
        where: {
          tenantId,
          status: 'active',
        },
      }),
    ]);

    const plans = await this.prisma.plan.findMany({
      where,
      select: {
        status: true,
        createdAt: true,
      },
    });

    const plansByStatus = plans.reduce((acc, plan) => {
      acc[plan.status] = (acc[plan.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      tenantId,
      period: {
        startDate: startDate || 'all time',
        endDate: endDate || 'now',
      },
      users: {
        total: totalUsers,
      },
      plans: {
        total: totalPlans,
        byStatus: plansByStatus,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
    };
  }

  /**
   * Get popular exercises
   */
  async getPopularExercises(tenantId: string, limit: number = 10) {
    const plans = await this.prisma.plan.findMany({
      where: { tenantId },
      include: {
        days: {
          include: {
            sessions: {
              select: {
                exercises: true,
              },
            },
          },
        },
      },
    });

    const exerciseCount: Record<string, number> = {};

    plans.forEach((plan) => {
      plan.days.forEach((day) => {
        day.sessions.forEach((session) => {
          if (Array.isArray(session.exercises)) {
            (session.exercises as any[]).forEach((exercise) => {
              const exerciseName = exercise.name || exercise.id;
              exerciseCount[exerciseName] = (exerciseCount[exerciseName] || 0) + 1;
            });
          }
        });
      });
    });

    const sorted = Object.entries(exerciseCount)
      .map(([name, count]) => ({ exercise: name, usageCount: count }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);

    return {
      topExercises: sorted,
      totalUniqueExercises: Object.keys(exerciseCount).length,
    };
  }

  /**
   * Get plan generation trends
   */
  async getPlanGenerationTrends(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const plans = await this.prisma.plan.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        type: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const dailyCounts: Record<string, number> = {};

    plans.forEach((plan) => {
      const date = plan.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      totalPlansGenerated: plans.length,
      dailyBreakdown: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        plansGenerated: count,
      })),
    };
  }
}
