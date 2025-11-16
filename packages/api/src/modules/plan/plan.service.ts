import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueueService } from '../../common/queue/queue.service';
import { Plan } from '@prisma/client';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookEvent } from '../webhook/webhook.types';

@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private webhookService: WebhookService,
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

  async findUserPlans(
    userId: string,
    includeDetails = false,
    params?: { skip?: number; take?: number },
  ) {
    const where = { userId };
    const include = includeDetails
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
        };

    const [plans, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        include,
        skip: params?.skip || 0,
        take: params?.take || 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
    ]);

    return { plans, total, hasMore: (params?.skip || 0) + plans.length < total };
  }

  async updatePlanStatus(id: string, status: string): Promise<Plan> {
    const plan = await this.prisma.plan.update({
      where: { id },
      data: { status },
    });

    // Trigger webhook for plan status change
    if (status === 'completed') {
      await this.webhookService.trigger(plan.tenantId, WebhookEvent.PLAN_COMPLETED, {
        planId: plan.id,
        userId: plan.userId,
        planName: plan.name,
        completedAt: new Date(),
      });
    } else {
      await this.webhookService.trigger(plan.tenantId, WebhookEvent.PLAN_UPDATED, {
        planId: plan.id,
        userId: plan.userId,
        status,
      });
    }

    return plan;
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
      include: { planDay: { include: { plan: true } } },
    });

    // Trigger webhook for session completion
    await this.webhookService.trigger(session.planDay.plan.tenantId, WebhookEvent.PLAN_UPDATED, {
      planId: session.planDay.planId,
      sessionId: session.id,
      sessionCompleted: true,
      feedback,
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
