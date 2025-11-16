import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const isProduction = process.env.NODE_ENV === 'production';

        // If Redis URL is configured and in production, use Redis
        if (redisUrl && isProduction) {
          const redisStore = require('cache-manager-redis-store').default;
          return {
            store: redisStore,
            url: redisUrl,
            ttl: parseInt(configService.get<string>('CACHE_TTL') || '300', 10), // 5 minutes default
            max: parseInt(configService.get<string>('CACHE_MAX_ITEMS') || '100', 10),
          };
        }

        // Otherwise, use in-memory cache (development)
        return {
          ttl: 60, // 1 minute in development
          max: 100,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
