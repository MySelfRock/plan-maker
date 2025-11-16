import { Worker, Job } from 'bullmq';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { GeminiService } from '../services/gemini.service';

export interface PlanAdjustmentJobData {
  planId: string;
  sessionId: string;
  feedback: {
    rating?: number;
    difficulty?: number;
    notes?: string;
    metrics?: any;
  };
}

export class PlanAdjustmentProcessor {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async process(job: Job<PlanAdjustmentJobData>): Promise<any> {
    const { planId, sessionId, feedback } = job.data;

    logger.info(`🔧 Processing plan adjustment job ${job.id} for plan ${planId}`);

    try {
      await job.updateProgress(10);

      // Get plan, session, and profile
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: {
          profile: true,
          days: {
            include: { sessions: true },
            orderBy: { date: 'asc' },
          },
        },
      });

      if (!plan) {
        throw new Error('Plan not found');
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      await job.updateProgress(30);

      // Analyze feedback
      const shouldAdjust = this.shouldAdjustPlan(feedback);

      if (!shouldAdjust) {
        logger.info(`ℹ️ No adjustment needed based on feedback`);
        return {
          success: true,
          adjusted: false,
          reason: 'Feedback does not require adjustment',
        };
      }

      await job.updateProgress(50);

      // Generate adjustment recommendations using AI
      const adjustmentPrompt = this.buildAdjustmentPrompt(plan, session, feedback);

      logger.info('🤖 Requesting AI for plan adjustment recommendations...');

      const aiResponse = await this.geminiService.generatePlan({
        profile: {
          niche: plan.profile.niche,
          level: plan.profile.level,
          goals: plan.profile.goals,
          availability: plan.profile.availability as any,
          equipment: plan.profile.equipment,
          constraints: plan.profile.constraints,
        },
        template: {
          aiPromptTemplate: adjustmentPrompt,
          rules: {},
          weeks: plan.weeks,
        },
        exercises: [],
        jsonSchema: { type: 'object' },
      });

      await job.updateProgress(80);

      // Apply adjustments (simplified - in production you'd update upcoming sessions)
      logger.info(`✅ Plan adjustment recommendations generated`);

      // Store adjustment in plan metadata
      await prisma.plan.update({
        where: { id: planId },
        data: {
          metadata: {
            adjustments: [
              ...(((plan.metadata as any)?.adjustments as any[]) || []),
              {
                timestamp: new Date(),
                sessionId,
                feedback,
                recommendations: aiResponse,
              },
            ],
          },
        },
      });

      await job.updateProgress(100);

      logger.info(`✅ Plan adjustment completed for plan ${planId}`);

      return {
        success: true,
        adjusted: true,
        recommendations: aiResponse,
      };
    } catch (error) {
      logger.error(`❌ Plan adjustment failed for job ${job.id}`, error);
      throw error;
    }
  }

  private shouldAdjustPlan(feedback: any): boolean {
    // Adjust if rating is low (< 3) or difficulty is too high/low
    if (feedback.rating && feedback.rating < 3) {
      return true;
    }

    if (feedback.difficulty) {
      // Too easy (< 3) or too hard (> 8)
      if (feedback.difficulty < 3 || feedback.difficulty > 8) {
        return true;
      }
    }

    return false;
  }

  private buildAdjustmentPrompt(plan: any, session: any, feedback: any): string {
    let prompt = `You are an expert trainer analyzing user feedback to adjust their plan.

Current Plan: ${plan.name}
Session: ${session.title}
User Feedback:
- Rating: ${feedback.rating || 'N/A'}/5
- Difficulty: ${feedback.difficulty || 'N/A'}/10
- Notes: ${feedback.notes || 'None'}

Niche: ${plan.profile.niche}
Level: ${plan.profile.level}
Goals: ${plan.profile.goals.join(', ')}

Based on this feedback, provide recommendations for adjusting the plan:
1. Should intensity be increased or decreased?
2. Should session duration be modified?
3. Should exercises be substituted?
4. Any other recommendations?

Respond in JSON format with clear, actionable recommendations.`;

    return prompt;
  }
}

export function createPlanAdjustmentWorker(redisConnection: any): Worker {
  const processor = new PlanAdjustmentProcessor();

  const worker = new Worker(
    'plan-adjustment',
    async (job) => {
      return processor.process(job);
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
    },
  );

  worker.on('completed', (job) => {
    logger.info(`✅ Plan adjustment job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Plan adjustment job ${job?.id} failed:`, err);
  });

  logger.info('🚀 Plan adjustment worker started');

  return worker;
}
