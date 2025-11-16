import { Worker, Job } from 'bullmq';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { PdfService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';

export interface PdfExportJobData {
  planId: string;
  userId: string;
  tenantId: string;
}

export class PdfExportProcessor {
  private pdfService: PdfService;
  private emailService: EmailService;

  constructor() {
    this.pdfService = new PdfService();
    this.emailService = new EmailService();
  }

  async process(job: Job<PdfExportJobData>): Promise<any> {
    const { planId, userId, tenantId } = job.data;

    logger.info(`📄 Processing PDF export job ${job.id} for plan ${planId}`);

    try {
      await job.updateProgress(10);

      // Get plan with all details
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: {
          user: true,
          days: {
            include: {
              sessions: true,
            },
            orderBy: { date: 'asc' },
          },
        },
      });

      if (!plan) {
        throw new Error('Plan not found');
      }

      await job.updateProgress(30);

      // Generate PDF
      const pdfUrl = await this.pdfService.generatePlanPdf({
        name: plan.name,
        user: {
          name: plan.user.name,
          email: plan.user.email,
        },
        startDate: plan.startDate,
        endDate: plan.endDate,
        weeks: plan.weeks || 12,
        days: plan.days as any,
      });

      await job.updateProgress(80);

      // Send email with PDF link
      try {
        await this.emailService.sendEmail({
          to: plan.user.email,
          subject: 'Your plan PDF is ready for download 📄',
          template: 'pdf-ready',
          context: {
            userName: plan.user.name,
            planName: plan.name,
            pdfUrl,
          },
        });
      } catch (emailError) {
        logger.warn('⚠️ Failed to send PDF notification email', emailError);
      }

      await job.updateProgress(100);

      logger.info(`✅ PDF export completed: ${pdfUrl}`);

      // Log event
      await prisma.event.create({
        data: {
          tenantId,
          userId,
          eventType: 'plan.exported.pdf',
          payload: {
            planId,
            pdfUrl,
          },
        },
      });

      return {
        success: true,
        pdfUrl,
      };
    } catch (error) {
      logger.error(`❌ PDF export failed for job ${job.id}`, error);
      throw error;
    }
  }
}

export function createPdfExportWorker(redisConnection: any): Worker {
  const processor = new PdfExportProcessor();

  const worker = new Worker(
    'pdf-export',
    async (job) => {
      return processor.process(job);
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
    },
  );

  worker.on('completed', (job) => {
    logger.info(`✅ PDF export job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ PDF export job ${job?.id} failed:`, err);
  });

  logger.info('🚀 PDF export worker started');

  return worker;
}
