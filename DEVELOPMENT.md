# Development Guide

Complete guide for setting up and developing PlanMaker SaaS locally.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [First-time Setup](#first-time-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Common Tasks](#common-tasks)

## Prerequisites

Before starting, ensure you have the following installed:

### Required
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Yarn** >= 1.22.0 (`npm install -g yarn`)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

### Optional (for production deployment)
- **Terraform** >= 1.5.0
- **kubectl** (Kubernetes CLI)
- **AWS CLI** or **Google Cloud SDK**

### Verify Installation

```bash
node --version  # Should be v18.x.x or higher
yarn --version  # Should be 1.22.x or higher
docker --version  # Should be 20.x.x or higher
```

## First-time Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd plan-maker

# Install all dependencies (this may take 2-3 minutes)
yarn install
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MinIO
yarn docker:up

# Verify all services are running
docker ps
```

You should see three containers running:
- `planmaker-postgres` (port 5432)
- `planmaker-redis` (port 6379)
- `planmaker-minio` (ports 9000, 9001)

### 3. Configure Environment Variables

```bash
# Copy example environment files
cp packages/api/.env.example packages/api/.env
cp packages/frontend/.env.example packages/frontend/.env
cp packages/worker/.env.example packages/worker/.env
```

**IMPORTANT**: Edit `packages/api/.env` and add your Gemini API key:

```env
GEMINI_API_KEY="your-actual-gemini-api-key"
```

> Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 4. Setup Database

```bash
# Run migrations and generate Prisma client
yarn migrate:dev

# Seed demo data (creates demo tenant and test users)
yarn workspace @planmaker/api prisma:seed
```

You should see:
```
✅ Created tenant: demo
✅ Created admin user: admin@demo.com
✅ Created test user: test@demo.com
✅ Created template: Beginner Weight Loss - 12 Weeks
✅ Created 4 sample exercises
🎉 Seeding completed successfully!
```

### 5. Verify Setup

```bash
# Check database connection
docker exec -it planmaker-postgres psql -U planmaker -d planmaker -c "\dt"

# Check Redis connection
docker exec -it planmaker-redis redis-cli ping
# Should output: PONG

# Access MinIO console
# Open http://localhost:9001 in browser
# Login: minioadmin / minioadmin
```

## Running the Application

### Development Mode (All Services)

```bash
# Start all services in parallel (API, Frontend, Worker)
yarn dev
```

This will start:
- **API** on http://localhost:3000
- **Frontend** on http://localhost:3001
- **Worker** (background process)

### Run Services Individually

```bash
# Terminal 1 - API
yarn dev:api

# Terminal 2 - Frontend
yarn dev:frontend

# Terminal 3 - Worker
yarn dev:worker
```

### Access the Application

1. **Frontend**: http://localhost:3001
2. **API Docs (Swagger)**: http://localhost:3000/api/docs
3. **MinIO Console**: http://localhost:9001

### Test Credentials

After seeding, you can login with:

**Admin User**
- Email: `admin@demo.com`
- Password: `admin123`

**Regular User**
- Email: `test@demo.com`
- Password: `test123`

## Development Workflow

### Making Changes

1. **Backend Changes** (`packages/api/`)
   - Edit files in `src/`
   - Server auto-reloads with NestJS watch mode
   - API endpoint changes reflect immediately

2. **Frontend Changes** (`packages/frontend/`)
   - Edit files in `src/`
   - Next.js Fast Refresh updates browser instantly
   - No manual refresh needed

3. **Worker Changes** (`packages/worker/`)
   - Edit files in `src/`
   - Worker auto-restarts with nodemon
   - Jobs are reprocessed automatically

### Database Changes

When modifying the Prisma schema:

```bash
# 1. Edit packages/api/prisma/schema.prisma

# 2. Create migration
cd packages/api
npx prisma migrate dev --name your_migration_name

# 3. Generate Prisma client
npx prisma generate
```

### Adding New Dependencies

```bash
# Add to specific package
yarn workspace @planmaker/api add <package-name>
yarn workspace @planmaker/frontend add <package-name>

# Add dev dependency
yarn workspace @planmaker/api add -D <package-name>

# Add to root (build tools only)
yarn add -D -W <package-name>
```

## Testing

### Run All Tests

```bash
yarn test
```

### Run Tests for Specific Package

```bash
# API tests
yarn workspace @planmaker/api test

# Watch mode
yarn workspace @planmaker/api test:watch

# Coverage
yarn workspace @planmaker/api test:cov
```

### E2E Tests (Frontend)

```bash
yarn workspace @planmaker/frontend test:e2e
```

### Manual API Testing

Use the Swagger UI at http://localhost:3000/api/docs or import the Postman collection from `docs/postman/`.

## Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` errors:

```bash
# Check what's using the port (macOS/Linux)
lsof -i :3000  # or :3001, :5432, etc.

# Kill the process
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Failed

```bash
# Restart PostgreSQL container
docker restart planmaker-postgres

# Check logs
docker logs planmaker-postgres

# Reset database (⚠️ deletes all data)
docker-compose down -v
yarn docker:up
yarn migrate:dev
yarn workspace @planmaker/api prisma:seed
```

### Redis Connection Failed

```bash
# Restart Redis
docker restart planmaker-redis

# Check if Redis is responding
docker exec -it planmaker-redis redis-cli ping
```

### Prisma Client Not Generated

```bash
cd packages/api
npx prisma generate
```

### MinIO Buckets Not Created

```bash
# Manually create buckets
docker exec -it planmaker-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it planmaker-minio mc mb local/planmaker-assets
docker exec -it planmaker-minio mc mb local/planmaker-exports
docker exec -it planmaker-minio mc anonymous set download local/planmaker-assets
```

### Worker Not Processing Jobs

Check that:
1. Redis is running: `docker ps | grep redis`
2. Worker is running: Check console output
3. Queue is not paused in BullMQ

```bash
# Check Redis keys
docker exec -it planmaker-redis redis-cli KEYS '*bull*'
```

### Gemini API Errors

If plan generation fails:

1. Verify API key is set correctly in `packages/api/.env`
2. Check quota at https://makersuite.google.com/
3. Ensure you're using a supported model (gemini-pro)
4. Check worker logs for detailed error messages

## Common Tasks

### View Database with Prisma Studio

```bash
yarn workspace @planmaker/api prisma:studio
```

Opens GUI at http://localhost:5555

### Reset Database (⚠️ Destructive)

```bash
# Delete all data and re-migrate
cd packages/api
npx prisma migrate reset

# Seed demo data
yarn prisma:seed
```

### View Docker Logs

```bash
# All services
yarn docker:logs

# Specific service
docker logs -f planmaker-postgres
docker logs -f planmaker-redis
docker logs -f planmaker-minio
```

### Clean Build Artifacts

```bash
# Clean all packages
yarn clean  # (if script exists)

# Manual cleanup
rm -rf node_modules packages/*/node_modules
rm -rf packages/*/.next packages/*/dist
yarn install
```

### Update Dependencies

```bash
# Check for outdated packages
yarn outdated

# Update all to latest within semver range
yarn upgrade

# Update specific package
yarn workspace @planmaker/api upgrade <package-name>
```

### Create New Migration

```bash
cd packages/api

# Create migration from schema changes
npx prisma migrate dev --name add_new_feature

# Apply migration in production
npx prisma migrate deploy
```

### Generate New API Module

```bash
cd packages/api

# Generate NestJS resource (CRUD)
npx nest g resource modules/my-module
```

### Add New Frontend Page

```bash
cd packages/frontend

# Create new page component
mkdir -p src/app/my-page
touch src/app/my-page/page.tsx
```

### Debug TypeScript Issues

```bash
# Check types across all packages
yarn workspace @planmaker/api tsc --noEmit
yarn workspace @planmaker/frontend tsc --noEmit
yarn workspace @planmaker/worker tsc --noEmit
```

### Profile API Performance

```bash
# Enable detailed logging
# Edit packages/api/.env
LOG_LEVEL=debug

# Restart API
yarn dev:api
```

### Test Email Templates Locally

```bash
# Install ethereal (fake SMTP)
# Edit packages/worker/.env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=<ethereal-user>
SMTP_PASSWORD=<ethereal-password>

# Get credentials from: https://ethereal.email/
```

## Production Build

### Build All Packages

```bash
# Build everything
yarn build

# Build specific package
yarn workspace @planmaker/api build
yarn workspace @planmaker/frontend build
```

### Run Production Build Locally

```bash
# API
cd packages/api
yarn build
yarn start:prod

# Frontend
cd packages/frontend
yarn build
yarn start

# Worker
cd packages/worker
yarn build
yarn start
```

## Environment Variables Reference

### API Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWTs | `super-secret-key-change-me` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `S3_ENDPOINT` | S3 endpoint URL | `http://localhost:9000` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3001` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `PlanMaker` |

### Worker Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:3001` |

## Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Next.js Docs**: https://nextjs.org/docs
- **BullMQ Docs**: https://docs.bullmq.io
- **Gemini API**: https://ai.google.dev/docs

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Check Docker container logs
4. Verify environment variables are set correctly
5. Try resetting the database
6. Create a new GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

---

Happy coding! 🚀
