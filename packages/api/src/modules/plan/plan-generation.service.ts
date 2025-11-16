import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GeminiService } from '../../common/gemini/gemini.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookEvent } from '../webhook/webhook.types';

/**
 * Service responsible for AI-powered plan generation
 * Combines rules engine + Gemini AI
 */
@Injectable()
export class PlanGenerationService {
  private readonly logger = new Logger(PlanGenerationService.name);
  private readonly planSchemaCache: any; // Static schema, initialized once

  constructor(
    private gemini: GeminiService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private webhookService: WebhookService,
  ) {
    // Initialize static plan schema once (no need to rebuild every time)
    this.planSchemaCache = this.buildPlanSchema();
  }

  /**
   * Generate a new plan using AI + rules
   */
  async generatePlan(params: {
    userId: string;
    tenantId: string;
    profileId: string;
    templateId?: string;
    planType: string;
    startDate: Date;
    weeks?: number;
  }) {
    this.logger.log(`Generating plan for user ${params.userId}`);

    // 1. Get profile
    const profile = await this.prisma.profile.findUnique({
      where: { id: params.profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${params.profileId} not found`);
    }

    // 2. Get or use default template
    let template;
    if (params.templateId) {
      template = await this.prisma.template.findUnique({
        where: { id: params.templateId },
      });
    } else {
      // Find default template for niche/level
      template = await this.prisma.template.findFirst({
        where: {
          tenantId: params.tenantId,
          niche: profile.niche,
          level: profile.level,
          isPublic: true,
        },
      });
    }

    if (!template) {
      throw new NotFoundException(
        `No suitable template found for niche: ${profile.niche}, level: ${profile.level}`,
      );
    }

    // 3. Get available exercises (cached)
    const exercises = await this.getCachedExercises(
      params.tenantId,
      profile.niche,
      profile.equipment,
    );

    // 4. Use cached JSON schema
    const jsonSchema = this.planSchemaCache;

    // 5. Call Gemini to generate plan
    const aiPlan = await this.gemini.generatePlan({
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
        weeks: params.weeks || template.weeks,
      },
      exercises,
      jsonSchema,
    });

    // 6. Save plan to database
    const plan = await this.savePlanToDatabase({
      userId: params.userId,
      tenantId: params.tenantId,
      profileId: params.profileId,
      templateId: template.id,
      planType: params.planType,
      startDate: params.startDate,
      weeks: params.weeks || template.weeks || 12,
      aiPlan,
    });

    this.logger.log(`Plan generated successfully: ${plan.id}`);

    // Trigger webhook for plan creation
    await this.webhookService.trigger(params.tenantId, WebhookEvent.PLAN_GENERATED, {
      planId: plan.id,
      userId: params.userId,
      profileId: params.profileId,
      templateId: template.id,
      planName: plan.name,
      planType: plan.type,
      weeks: plan.weeks,
      startDate: plan.startDate,
    });

    return plan;
  }

  /**
   * Get exercises for plan generation with caching
   * Exercises are cached for 10 minutes since they rarely change
   */
  private async getCachedExercises(
    tenantId: string,
    niche: string,
    equipment: string[],
  ): Promise<any[]> {
    const cacheKey = `exercises:${tenantId}:${niche}:${equipment.sort().join(',')}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Using cached exercises for ${niche}`);
      return cached;
    }

    this.logger.debug(`Fetching exercises from database for ${niche}`);
    const exercises = await this.prisma.exercise.findMany({
      where: {
        tenantId,
        niche,
        equipment: {
          hasSome: equipment.length > 0 ? equipment : undefined,
        },
      },
      take: 50, // limit for AI context
      select: {
        id: true,
        name: true,
        description: true,
        intensity: true,
        duration: true,
        equipment: true,
        // Omit large fields like videos, detailed instructions to reduce prompt size
      },
    });

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, exercises, 600000);

    return exercises;
  }

  /**
   * Build JSON schema for AI output validation
   */
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

  /**
   * Save AI-generated plan to database
   * Uses transaction to ensure data consistency - all operations succeed or all fail
   */
  private async savePlanToDatabase(params: any) {
    const { userId, tenantId, profileId, templateId, planType, startDate, weeks, aiPlan } = params;

    return this.prisma.$transaction(async (tx) => {
      // Create plan
      const plan = await tx.plan.create({
        data: {
          userId,
          tenantId,
          profileId,
          templateId,
          name: aiPlan.plan_name,
          type: planType,
          status: 'active',
          startDate: new Date(startDate),
          weeks,
          rationale: aiPlan.rationale,
        },
      });

      // Create plan days and sessions
      const currentDate = new Date(startDate);

      for (const weekData of aiPlan.weekly_schedule) {
        for (const dayData of weekData.days) {
          const planDay = await tx.planDay.create({
            data: {
              planId: plan.id,
              date: new Date(currentDate),
              weekday: dayData.weekday,
              isRestDay: dayData.isRestDay || false,
            },
          });

          // Create sessions for this day
          if (dayData.sessions && dayData.sessions.length > 0) {
            for (const sessionData of dayData.sessions) {
              await tx.session.create({
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

      // Return complete plan with days and sessions
      return tx.plan.findUnique({
        where: { id: plan.id },
        include: {
          days: {
            include: {
              sessions: true,
            },
            orderBy: { date: 'asc' },
          },
        },
      });
    });
  }
}
