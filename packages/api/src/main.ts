import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { initializeSentry } from './common/sentry/sentry.config';
import { SentryInterceptor } from './common/sentry/sentry.interceptor';

async function bootstrap() {
  // Initialize Sentry first to catch all errors
  initializeSentry();

  const app = await NestFactory.create(AppModule);

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Global Sentry interceptor for error tracking
  app.useGlobalInterceptors(new SentryInterceptor());

  // Enable compression (gzip/deflate)
  app.use(
    compression({
      filter: (req, res) => {
        // Don't compress responses if this request header is present
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use compression filter function
        return compression.filter(req, res);
      },
      level: 6, // Compression level (0-9), 6 is a good balance
      threshold: 1024, // Only compress responses > 1KB
    }),
  );

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
          scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'], // Allow external images
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Swagger UI to work
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global rate limiting guard
  app.useGlobalGuards(new ThrottlerGuard({ reflector: new Reflector() }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('PlanMaker SaaS API')
    .setDescription('White-label platform for personalized activity planning with AI')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('tenants', 'Multi-tenant management')
    .addTag('users', 'User management')
    .addTag('profiles', 'User profiles and onboarding')
    .addTag('plans', 'Plan management')
    .addTag('templates', 'Plan templates')
    .addTag('exercises', 'Exercise library')
    .addTag('subscriptions', 'Subscription and payments')
    .addTag('admin', 'Admin endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  🚀 PlanMaker SaaS API is running!

  📡 API: http://localhost:${port}${apiPrefix}
  📚 Swagger Docs: http://localhost:${port}/api/docs
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
