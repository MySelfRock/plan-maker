import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import { EmailService } from '../services/email.service';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: any;
}

export class EmailProcessor {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { to, subject, template, context } = job.data;

    logger.info(`📧 Processing email job ${job.id} to ${to}`);

    try {
      await this.emailService.sendEmail({
        to,
        subject,
        template,
        context,
      });

      logger.info(`✅ Email sent successfully: ${job.id}`);

      return {
        success: true,
        to,
        subject,
      };
    } catch (error) {
      logger.error(`❌ Email sending failed for job ${job.id}`, error);
      throw error;
    }
  }
}

export function createEmailWorker(redisConnection: any): Worker {
  const processor = new EmailProcessor();

  const worker = new Worker(
    'email',
    async (job) => {
      return processor.process(job);
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    },
  );

  worker.on('completed', (job) => {
    logger.info(`✅ Email job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Email job ${job?.id} failed:`, err);
  });

  logger.info('🚀 Email worker started');

  return worker;
}
