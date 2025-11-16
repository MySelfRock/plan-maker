import { Injectable, OnModuleInit, OnModuleDestroy, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pool configuration
      // See: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management
      __internal: {
        engine: {
          // Connection pool size (default: num_cpus * 2 + 1)
          // For production, adjust based on your server capacity
          connection_limit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10', 10),

          // Connection timeout in seconds
          pool_timeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10),
        },
      },
    } as any); // Type assertion needed for __internal
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }

  /**
   * Clean database for testing
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Cannot clean database in production environment');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key !== '_engine' && key !== '_fetcher' && typeof key === 'string',
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as string];
        if (model && typeof model.deleteMany === 'function') {
          return model.deleteMany();
        }
      }),
    );
  }
}
