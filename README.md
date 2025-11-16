# PlanMaker SaaS - White-label Activity Planning Platform

A complete white-label SaaS platform for generating personalized activity plans using AI (Gemini) across multiple niches (fitness, music, study, skills).

## 🎯 Features

- **White-label/Multi-tenant**: Fully customizable for different brands
- **AI-Powered Planning**: Gemini integration for intelligent plan generation
- **Multi-niche Support**: Fitness, music, study, skills, and more
- **Adaptive Plans**: Auto-adjustment based on user progress and feedback
- **Payment Integration**: Stripe for subscriptions and trials
- **Admin Dashboard**: Content management, user analytics, template editing
- **REST + GraphQL APIs**: Flexible integration options
- **Scalable Architecture**: Kubernetes-ready microservices

## 🏗️ Architecture

This monorepo is structured for easy separation into independent repositories:

```
packages/
├── api/        → Backend NestJS API (separate repo ready)
├── frontend/   → Next.js web application (separate repo ready)
├── worker/     → BullMQ background jobs (separate repo ready)
├── shared/     → Shared TypeScript types and utilities
└── infra/      → Terraform IaC and deployment configs
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Yarn >= 1.22
- Docker & Docker Compose
- PostgreSQL 15+ (via Docker)
- Redis 7+ (via Docker)

### Local Development

1. **Clone and install dependencies**
```bash
git clone <repository>
cd plan-maker
yarn install
```

2. **Start infrastructure services**
```bash
yarn docker:up
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO S3-compatible storage (ports 9000, 9001)

3. **Setup environment variables**
```bash
# Copy example env files
cp packages/api/.env.example packages/api/.env
cp packages/frontend/.env.example packages/frontend/.env
cp packages/worker/.env.example packages/worker/.env
```

4. **Run database migrations**
```bash
yarn migrate:dev
```

5. **Start development servers**
```bash
# Start all services in parallel
yarn dev

# Or start individually
yarn dev:api       # API on http://localhost:3000
yarn dev:frontend  # Frontend on http://localhost:3001
yarn dev:worker    # Worker process
```

## 📦 Package Structure

### @planmaker/api
Backend API built with NestJS, PostgreSQL, and Redis.

**Key Features:**
- Multi-tenant architecture
- JWT + OAuth authentication
- Gemini AI integration
- Stripe payment processing
- RESTful + GraphQL endpoints

**Stack:**
- NestJS, TypeScript
- Prisma ORM
- PostgreSQL
- Redis (cache + sessions)
- BullMQ (job queues)

### @planmaker/frontend
Modern web application with Next.js.

**Key Features:**
- White-label theming system
- Server-side rendering
- Dynamic onboarding flows
- Plan management dashboard
- Admin panel

**Stack:**
- Next.js 14+ (App Router)
- React 18
- TailwindCSS
- Zustand (state management)
- React Query

### @planmaker/worker
Background job processor for async tasks.

**Key Features:**
- Plan generation jobs
- Email notifications
- PDF export generation
- Payment reconciliation
- Adaptive plan adjustments

**Stack:**
- BullMQ
- Redis
- Shared business logic from API

### @planmaker/shared
Shared TypeScript types, utilities, and constants.

**Exports:**
- Common types (User, Plan, Session, etc.)
- Validation schemas (Zod)
- Utility functions
- Constants and enums

### @planmaker/infra
Infrastructure as Code and deployment configurations.

**Includes:**
- Terraform modules (AWS/GCP)
- Kubernetes manifests
- Helm charts
- CI/CD pipelines (GitHub Actions)
- Monitoring configs (Prometheus, Grafana)

## 🔧 Configuration

### Environment Variables

Each package has its own `.env` file. Key variables:

**API (`packages/api/.env`)**
```env
DATABASE_URL=postgresql://planmaker:password@localhost:5432/planmaker
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

**Frontend (`packages/frontend/.env`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Worker (`packages/worker/.env`)**
```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://planmaker:password@localhost:5432/planmaker
GEMINI_API_KEY=your-gemini-api-key
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run specific package tests
yarn workspace @planmaker/api test
yarn workspace @planmaker/frontend test

# E2E tests
yarn workspace @planmaker/frontend test:e2e

# Coverage
yarn test --coverage
```

## 🚢 Deployment

### Using Docker

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes

```bash
cd packages/infra/k8s

# Apply manifests
kubectl apply -f namespaces/
kubectl apply -f configmaps/
kubectl apply -f secrets/
kubectl apply -f deployments/
kubectl apply -f services/
kubectl apply -f ingress/
```

### Using Terraform (AWS)

```bash
cd packages/infra/terraform/aws

terraform init
terraform plan
terraform apply
```

## 📊 Monitoring

- **Metrics**: Prometheus (port 9090)
- **Visualization**: Grafana (port 3002)
- **Logs**: Loki + Promtail
- **Tracing**: OpenTelemetry + Jaeger
- **Errors**: Sentry integration

## 🔐 Security

- TLS/SSL everywhere (Let's Encrypt)
- Argon2id password hashing
- JWT with refresh token rotation
- RBAC for admin endpoints
- Rate limiting (Redis-based)
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF tokens
- Audit logging

## 📝 API Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **GraphQL Playground**: http://localhost:3000/graphql
- **Postman Collection**: `docs/postman/`

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

- **Documentation**: https://docs.planmaker.io
- **Issues**: GitHub Issues
- **Email**: support@planmaker.io

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Marketplace for coach templates
- [ ] Multimodal content (video/audio instructions)
- [ ] Fine-tuned models for specific niches
- [ ] White-label mobile SDKs
- [ ] Advanced analytics and BI
- [ ] Multi-language support (i18n)
- [ ] Offline-first PWA

---

Built with ❤️ using modern web technologies
