import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from './common/cache/cache.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PlanModule } from './modules/plan/plan.module';
import { TemplateModule } from './modules/template/template.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { GeminiModule } from './common/gemini/gemini.module';
import { StorageModule } from './common/storage/storage.module';
import { QueueModule } from './common/queue/queue.module';
import { EventModule } from './modules/event/event.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Common modules
    LoggerModule,
    CacheModule,
    PrismaModule,
    GeminiModule,
    StorageModule,
    QueueModule,

    // Feature modules
    HealthModule,
    TenantModule,
    AuthModule,
    UserModule,
    ProfileModule,
    PlanModule,
    TemplateModule,
    ExerciseModule,
    SubscriptionModule,
    EventModule,
  ],
})
export class AppModule {}
