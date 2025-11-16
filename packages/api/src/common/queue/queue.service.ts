import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

export enum QueueName {
  PLAN_GENERATION = 'plan-generation',
  EMAIL = 'email',
  PDF_EXPORT = 'pdf-export',
  PLAN_ADJUSTMENT = 'plan-adjustment',
}

export interface PlanGenerationJob {
  userId: string;
  tenantId: string;
  profileId: string;
  templateId?: string;
  planType: string;
  startDate: Date;
  weeks?: number;
}

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection: Redis;
  private queues: Map<QueueName, Queue> = new Map();

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  async onModuleInit() {
    // Initialize queues
    for (const queueName of Object.values(QueueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100, // keep last 100 completed jobs
          removeOnFail: 500, // keep last 500 failed jobs
        },
      });

      this.queues.set(queueName as QueueName, queue);
      this.logger.log(`Queue initialized: ${queueName}`);
    }
  }

  /**
   * Add plan generation job
   */
  async addPlanGenerationJob(data: PlanGenerationJob): Promise<string> {
    const queue = this.queues.get(QueueName.PLAN_GENERATION);
    const job = await queue.add('generate-plan', data, {
      priority: 1,
    });

    this.logger.log(`Plan generation job added: ${job.id}`);
    return job.id;
  }

  /**
   * Add email job
   */
  async addEmailJob(data: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }): Promise<string> {
    const queue = this.queues.get(QueueName.EMAIL);
    const job = await queue.add('send-email', data);

    this.logger.log(`Email job added: ${job.id}`);
    return job.id;
  }

  /**
   * Add PDF export job
   */
  async addPdfExportJob(data: { planId: string; userId: string; tenantId: string }): Promise<string> {
    const queue = this.queues.get(QueueName.PDF_EXPORT);
    const job = await queue.add('export-pdf', data);

    this.logger.log(`PDF export job added: ${job.id}`);
    return job.id;
  }

  /**
   * Add plan adjustment job (triggered by feedback)
   */
  async addPlanAdjustmentJob(data: { planId: string; sessionId: string; feedback: any }): Promise<string> {
    const queue = this.queues.get(QueueName.PLAN_ADJUSTMENT);
    const job = await queue.add('adjust-plan', data);

    this.logger.log(`Plan adjustment job added: ${job.id}`);
    return job.id;
  }

  /**
   * Get job status
   */
  async getJobStatus(queueName: QueueName, jobId: string): Promise<any> {
    const queue = this.queues.get(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: await job.progress(),
      state: await job.getState(),
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Get queue for direct access (used by workers)
   */
  getQueue(queueName: QueueName): Queue {
    return this.queues.get(queueName);
  }
}
