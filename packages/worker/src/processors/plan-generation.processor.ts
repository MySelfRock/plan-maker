import { Worker, Job } from 'bullmq';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { GeminiService } from '../services/gemini.service';
import { EmailService } from '../services/email.service';

export interface PlanGenerationJobData {
  userId: string;
  tenantId: string;
  profileId: string;
  templateId?: string;
  planType: string;
  startDate: Date;
  weeks?: number;
}

export class PlanGenerationProcessor {
  private geminiService: GeminiService;
  private emailService: EmailService;

  constructor() {
    this.geminiService = new GeminiService();
    this.emailService = new EmailService();
  }

  async process(job: Job<PlanGenerationJobData>): Promise<any> {
    const { userId, tenantId, profileId, templateId, planType, startDate, weeks } = job.data;

    logger.info(`📋 Processing plan generation job ${job.id} for user ${userId}`);

    try {
      // Update job progress
      await job.updateProgress(10);

      // 1. Get profile
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      await job.updateProgress(20);

      // 2. Get or find template
      let template;
      if (templateId) {
        template = await prisma.template.findUnique({
          where: { id: templateId },
        });
      } else {
        template = await prisma.template.findFirst({
          where: {
            OR: [{ tenantId }, { isPublic: true }],
            niche: profile.niche,
            level: profile.level,
          },
        });
      }

      if (!template) {
        throw new Error('No suitable template found');
      }

      await job.updateProgress(30);

      // 3. Get available exercises
      const exercises = await prisma.exercise.findMany({
        where: {
          tenantId,
          niche: profile.niche,
          equipment: {
            hasSome: profile.equipment.length > 0 ? profile.equipment : undefined,
          },
        },
        take: 50,
      });

      await job.updateProgress(40);

      // 4. Build JSON schema
      const jsonSchema = this.buildPlanSchema();

      // 5. Generate plan with AI
      logger.info(`🤖 Calling Gemini AI for plan generation...`);

      const aiPlan = await this.geminiService.generatePlan({
        profile: {
          niche: profile.niche,
          level: profile.level,
          goals: profile.goals,
          availability: profile.availability as any,
          equipment: profile.equipment,
          constraints: profile.constraints,
        },
        template: {
          aiPromptTemplate: template.aiPromptTemplate,
          rules: template.rules as any,
          weeks: weeks || template.weeks,
        },
        exercises,
        jsonSchema,
      });

      await job.updateProgress(70);

      // 6. Save plan to database
      const plan = await this.savePlanToDatabase({
        userId,
        tenantId,
        profileId,
        templateId: template.id,
        planType,
        startDate: new Date(startDate),
        weeks: weeks || template.weeks || 12,
        aiPlan,
      });

      await job.updateProgress(90);

      // 7. Send notification email
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (user) {
          await this.emailService.sendEmail({
            to: user.email,
            subject: 'Your personalized plan is ready! 🎉',
            template: 'plan-ready',
            context: {
              userName: user.name,
              planName: plan.name,
              planUrl: `${process.env.FRONTEND_URL}/plans/${plan.id}`,
            },
          });
        }
      } catch (emailError) {
        logger.warn('⚠️ Failed to send notification email', emailError);
        // Don't fail the job if email fails
      }

      await job.updateProgress(100);

      logger.info(`✅ Plan generation completed: ${plan.id}`);

      // Log event
      await prisma.event.create({
        data: {
          tenantId,
          userId,
          eventType: 'plan.generated',
          payload: {
            planId: plan.id,
            profileId,
            templateId: template.id,
          },
        },
      });

      return {
        success: true,
        planId: plan.id,
        plan,
      };
    } catch (error) {
      logger.error(`❌ Plan generation failed for job ${job.id}`, error);

      // Log error event
      await prisma.event.create({
        data: {
          tenantId,
          userId,
          eventType: 'plan.generation_failed',
          payload: {
            error: error.message,
            profileId,
          },
        },
      });

      throw error;
    }
  }

  private buildPlanSchema() {
    return {
      type: 'object',
      required: ['plan_name', 'niche', 'level', 'weekly_schedule', 'rationale'],
      properties: {
        plan_name: { type: 'string' },
        niche: { type: 'string' },
        level: { type: 'string' },
        weeks: { type: 'number' },
        weekly_schedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              week: { type: 'number' },
              days: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    weekday: { type: 'string' },
                    isRestDay: { type: 'boolean' },
                    sessions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          description: { type: 'string' },
                          duration_min: { type: 'number' },
                          intensity: { type: 'string' },
                          exercises: { type: 'array' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        rationale: { type: 'string' },
      },
    };
  }

  private async savePlanToDatabase(params: any) {
    const { userId, tenantId, profileId, templateId, planType, startDate, weeks, aiPlan } = params;

    // Create plan
    const plan = await prisma.plan.create({
      data: {
        userId,
        tenantId,
        profileId,
        templateId,
        name: aiPlan.plan_name,
        type: planType,
        status: 'active',
        startDate,
        weeks,
        rationale: aiPlan.rationale,
      },
    });

    // Create plan days and sessions
    const currentDate = new Date(startDate);

    for (const weekData of aiPlan.weekly_schedule) {
      for (const dayData of weekData.days) {
        const planDay = await prisma.planDay.create({
          data: {
            planId: plan.id,
            date: new Date(currentDate),
            weekday: dayData.weekday,
            isRestDay: dayData.isRestDay || false,
          },
        });

        if (dayData.sessions && dayData.sessions.length > 0) {
          for (const sessionData of dayData.sessions) {
            await prisma.session.create({
              data: {
                planDayId: planDay.id,
                title: sessionData.title,
                description: sessionData.description || '',
                exercises: sessionData.exercises || [],
                totalDuration: sessionData.duration_min || 30,
                intensity: sessionData.intensity || 'moderate',
                status: 'pending',
              },
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Return complete plan
    return prisma.plan.findUnique({
      where: { id: plan.id },
      include: {
        days: {
          include: { sessions: true },
          orderBy: { date: 'asc' },
        },
      },
    });
  }
}

export function createPlanGenerationWorker(redisConnection: any): Worker {
  const processor = new PlanGenerationProcessor();

  const worker = new Worker(
    'plan-generation',
    async (job) => {
      return processor.process(job);
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
    },
  );

  worker.on('completed', (job) => {
    logger.info(`✅ Plan generation job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Plan generation job ${job?.id} failed:`, err);
  });

  logger.info('🚀 Plan generation worker started');

  return worker;
}
