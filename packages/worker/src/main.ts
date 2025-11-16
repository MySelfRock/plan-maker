import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import { logger } from './utils/logger';
import { prisma } from './utils/database';
import { createPlanGenerationWorker } from './processors/plan-generation.processor';
import { createEmailWorker } from './processors/email.processor';
import { createPdfExportWorker } from './processors/pdf-export.processor';
import { createPlanAdjustmentWorker } from './processors/plan-adjustment.processor';

// Load environment variables
dotenv.config();

class WorkerApplication {
  private workers: any[] = [];
  private redisConnection: Redis;

  constructor() {
    logger.info('🚀 Starting PlanMaker Worker Application...');

    // Create Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.redisConnection.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    this.redisConnection.on('error', (error) => {
      logger.error('❌ Redis connection error:', error);
    });
  }

  async start() {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection verified');

      // Initialize workers
      logger.info('🔧 Initializing workers...');

      const planGenerationWorker = createPlanGenerationWorker(this.redisConnection);
      this.workers.push(planGenerationWorker);

      const emailWorker = createEmailWorker(this.redisConnection);
      this.workers.push(emailWorker);

      const pdfExportWorker = createPdfExportWorker(this.redisConnection);
      this.workers.push(pdfExportWorker);

      const planAdjustmentWorker = createPlanAdjustmentWorker(this.redisConnection);
      this.workers.push(planAdjustmentWorker);

      logger.info(`✅ ${this.workers.length} workers initialized and running`);

      // Log configuration
      this.logConfiguration();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('🎉 Worker application started successfully!');
      logger.info('📊 Waiting for jobs...');
    } catch (error) {
      logger.error('❌ Failed to start worker application:', error);
      process.exit(1);
    }
  }

  private logConfiguration() {
    logger.info('⚙️  Configuration:');
    logger.info(`   - Node Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   - Worker Concurrency: ${process.env.WORKER_CONCURRENCY || '5'}`);
    logger.info(`   - Log Level: ${process.env.LOG_LEVEL || 'info'}`);
    logger.info(`   - Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
    logger.info(`   - Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    logger.info(`   - Email (SMTP): ${process.env.SMTP_HOST ? '✅ Configured' : '❌ Not configured'}`);
    logger.info(`   - S3 Storage: ${process.env.S3_ENDPOINT ? '✅ Configured' : '❌ Not configured'}`);
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      try {
        // Close all workers
        logger.info('🛑 Closing workers...');
        await Promise.all(this.workers.map((worker) => worker.close()));

        // Close Redis connection
        logger.info('🛑 Closing Redis connection...');
        await this.redisConnection.quit();

        // Close database connection
        logger.info('🛑 Closing database connection...');
        await prisma.$disconnect();

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }
}

// Start the application
const app = new WorkerApplication();
app.start();
