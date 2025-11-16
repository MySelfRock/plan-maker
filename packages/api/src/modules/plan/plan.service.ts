import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueueService } from '../../common/queue/queue.service';
import { Plan } from '@prisma/client';

@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async findById(id: string, includeDetails = true): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: includeDetails
        ? {
            days: {
              include: { sessions: true },
              orderBy: { date: 'asc' },
            },
          }
        : undefined,
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async findUserPlans(userId: string, includeDetails = false): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { userId },
      include: includeDetails
        ? {
            profile: true,
            template: true,
            days: {
              include: { sessions: true },
              orderBy: { date: 'asc' },
            },
          }
        : {
            profile: true, // Always include profile to avoid N+1
            template: true, // Always include template to avoid N+1
          },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePlanStatus(id: string, status: string): Promise<Plan> {
    return this.prisma.plan.update({
      where: { id },
      data: { status },
    });
  }

  async completeSession(sessionId: string, feedback: any): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        feedback,
      },
    });

    // Optionally trigger plan adjustment based on feedback
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { planDay: true },
    });

    if (feedback.rating && feedback.rating < 3) {
      // Poor rating, queue plan adjustment
      await this.queueService.addPlanAdjustmentJob({
        planId: session.planDay.planId,
        sessionId,
        feedback,
      });
    }
  }

  async requestPlanGeneration(params: {
    userId: string;
    tenantId: string;
    profileId: string;
    planType: string;
    startDate: Date;
    weeks?: number;
    templateId?: string;
  }): Promise<{ jobId: string }> {
    const jobId = await this.queueService.addPlanGenerationJob(params);
    return { jobId };
  }
}
