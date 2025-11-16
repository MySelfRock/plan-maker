import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class DatabaseService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });

      DatabaseService.instance.$connect()
        .then(() => logger.info('✅ Database connected'))
        .catch((error) => logger.error('❌ Database connection failed', error));
    }

    return DatabaseService.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
      logger.info('👋 Database disconnected');
    }
  }
}

export const prisma = DatabaseService.getInstance();
