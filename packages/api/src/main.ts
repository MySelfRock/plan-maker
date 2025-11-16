import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

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
