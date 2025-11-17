# 🚀 PlanMaker SaaS - Demo Environment

This is a complete, ready-to-present demo environment for **PlanMaker SaaS** - a white-label platform for personalized activity planning with AI.

## 🎯 Purpose

This demo environment is designed for:
- **Sales presentations** to potential clients
- **Product demonstrations** for stakeholders
- **Proof of concept** showcases
- **Quick testing** of the platform

## ✨ What's Included

The demo environment includes:

### 🏢 Two Multi-Tenant Organizations

1. **FitPro Academy** - Fitness-focused tenant
   - 3 users (Admin, Coach, User)
   - 3 fitness templates (Weight Loss, Muscle Building, Marathon)
   - Sample exercises library
   - Active plan with progress tracking

2. **MusicMaster School** - Music education tenant
   - 3 users (Admin, Coach, User)
   - 2 music templates (Guitar, Piano)
   - User profiles with goals and preferences
   - Webhook configurations

### 🎨 Services

- ✅ **PostgreSQL** - Main database with demo data
- ✅ **Redis** - Caching and job queues
- ✅ **MinIO** - S3-compatible object storage
- ✅ **NestJS API** - Complete REST API with Swagger docs
- ✅ **BullMQ Worker** - Background job processing
- ✅ **Health Checks** - Kubernetes-ready health endpoints

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- 8GB+ RAM available
- Ports available: 3000, 5432, 6379, 9000, 9001

### Start Demo (One Command!)

```bash
./start-demo.sh
```

This script will:
1. ✅ Check prerequisites (Docker, docker-compose)
2. 🧹 Clean up any existing demo containers
3. 🚀 Start all services (PostgreSQL, Redis, MinIO, API, Worker)
4. ⏳ Wait for all services to be healthy
5. 🌱 Run database migrations
6. 📊 Seed comprehensive demo data
7. ✅ Display access information and credentials

**Total startup time:** ~2-3 minutes (first run), ~30 seconds (subsequent runs)

### Stop Demo

```bash
./stop-demo.sh
```

You'll be asked if you want to preserve or delete the demo data.

## 🔐 Demo Credentials

### FitPro Academy (fitpro-demo)

| Role  | Email                     | Password   | Description                    |
|-------|---------------------------|------------|--------------------------------|
| Admin | admin@fitpro-demo.com     | Admin123!  | Full administrative access     |
| Coach | coach@fitpro-demo.com     | Coach123!  | Create templates and plans     |
| User  | user@fitpro-demo.com      | User123!   | End user with active plan      |

### MusicMaster School (musicmaster-demo)

| Role  | Email                         | Password   | Description                    |
|-------|-------------------------------|------------|--------------------------------|
| Admin | admin@musicmaster-demo.com    | Admin123!  | Full administrative access     |
| Coach | coach@musicmaster-demo.com    | Coach123!  | Create templates and plans     |
| User  | user@musicmaster-demo.com     | User123!   | End user with profile          |

## 📡 Access Points

### API & Documentation

- **REST API:** http://localhost:3000/api/v1
- **Swagger Documentation:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/v1/health
- **Liveness Probe:** http://localhost:3000/api/v1/health/live
- **Readiness Probe:** http://localhost:3000/api/v1/health/ready
- **Metrics:** http://localhost:3000/api/v1/health/metrics

### MinIO Console (S3 Storage)

- **URL:** http://localhost:9001
- **Username:** demo
- **Password:** demo123demo

### Database Direct Access

```bash
# Connect to PostgreSQL
docker exec -it planmaker-demo-postgres psql -U demo -d planmaker_demo

# Connect to Redis
docker exec -it planmaker-demo-redis redis-cli
```

## 🎬 Demo Presentation Flow

### 1. Show the API Documentation (2 minutes)

```
Open: http://localhost:3000/api/docs
```

- Show organized API endpoints by domain (Auth, Plans, Templates, etc.)
- Highlight multi-tenant architecture
- Show comprehensive data validation (DTOs)
- Point out built-in rate limiting and security

### 2. Authenticate (1 minute)

1. Click **"Authorize"** button in Swagger
2. Use **POST /api/v1/auth/login**:
   ```json
   {
     "email": "user@fitpro-demo.com",
     "password": "User123!"
   }
   ```
3. Copy the `accessToken` from response
4. Paste into authorization dialog
5. Click **"Authorize"**

### 3. Demonstrate Key Features (5-7 minutes)

#### a) Multi-Tenancy
- Show tenant isolation (FitPro vs MusicMaster)
- GET /api/v1/tenants/{slug} to show tenant configuration
- Highlight white-label theming

#### b) User Profiles & Onboarding
- GET /api/v1/profiles/me
- Show personalized user data (goals, availability, equipment)
- Explain AI uses this for personalization

#### c) Template Library
- GET /api/v1/templates
- Show niche-specific templates (fitness, music)
- Filter by level (beginner, intermediate, advanced)
- Show template rules and constraints

#### d) AI Plan Generation
- POST /api/v1/plans/generate
- Show how AI creates personalized plans
- Highlight schedule optimization
- Show progressive difficulty

#### e) Plan Management
- GET /api/v1/plans/{id}
- Show detailed weekly schedule
- PUT /api/v1/plans/{id}/sessions/{sessionId}/complete
- Show progress tracking

#### f) Analytics & Export
- GET /api/v1/plans/{id}/analytics
- Show completion rates and insights
- GET /api/v1/plans/{id}/export/pdf
- Download professional plan document

#### g) Webhooks & Integrations
- GET /api/v1/webhooks
- Show event-driven architecture
- Explain integration with external systems

### 4. Show Health & Monitoring (1 minute)

```
Open: http://localhost:3000/api/v1/health
```

- Show real-time health status
- Database connectivity
- Memory usage
- System uptime
- Production-ready monitoring

### 5. Admin Features (2 minutes)

Login as admin (admin@fitpro-demo.com / Admin123!):

- GET /api/v1/admin/audit-logs - Show audit trail
- POST /api/v1/admin/templates - Create new template
- GET /api/v1/admin/users - User management

## 🛠️ Customization

### Add Your Google AI API Key

For real AI plan generation, update `.env.demo`:

```bash
# Get your key from: https://makersuite.google.com/app/apikey
GOOGLE_AI_API_KEY=your-actual-api-key-here
```

Then restart:
```bash
docker-compose -f docker-compose.demo.yml restart api worker
```

### Configure Real Email

Update `.env.demo` with SMTP settings:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Add More Demo Data

Edit `packages/api/prisma/seed-demo.ts` and run:

```bash
docker-compose -f docker-compose.demo.yml exec api yarn prisma:seed:demo
```

## 📊 Demo Data Overview

The demo includes:

- ✅ **2 Tenants** (FitPro, MusicMaster)
- ✅ **6 Users** (2 admins, 2 coaches, 2 users)
- ✅ **5 Templates** (3 fitness, 2 music)
- ✅ **3 Exercises** (sample library)
- ✅ **2 User Profiles** (with goals and preferences)
- ✅ **1 Active Plan** (with progress tracking)
- ✅ **2 Webhooks** (integration examples)
- ✅ **Audit Logs** (compliance tracking)

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker info

# View logs
docker-compose -f docker-compose.demo.yml logs

# Restart from scratch
docker-compose -f docker-compose.demo.yml down -v
./start-demo.sh
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5432

# Stop conflicting service or change port in docker-compose.demo.yml
```

### Database Connection Errors

```bash
# Wait longer for PostgreSQL to be ready
docker-compose -f docker-compose.demo.yml logs postgres

# Manually run migrations
docker-compose -f docker-compose.demo.yml exec api yarn prisma:migrate:prod
docker-compose -f docker-compose.demo.yml exec api yarn prisma:seed:demo
```

### Out of Memory

```bash
# Increase Docker Desktop memory limit (8GB+ recommended)
# Settings > Resources > Advanced > Memory
```

## 🔄 Managing the Demo

### View Logs

```bash
# All services
docker-compose -f docker-compose.demo.yml logs -f

# Specific service
docker-compose -f docker-compose.demo.yml logs -f api
docker-compose -f docker-compose.demo.yml logs -f worker
docker-compose -f docker-compose.demo.yml logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.demo.yml restart

# Restart specific service
docker-compose -f docker-compose.demo.yml restart api
```

### Reset Demo Data

```bash
# Stop and remove volumes
docker-compose -f docker-compose.demo.yml down -v

# Start fresh
./start-demo.sh
```

### Update Code and Rebuild

```bash
# Stop demo
./stop-demo.sh

# Rebuild images
docker-compose -f docker-compose.demo.yml build

# Start with new code
./start-demo.sh
```

## 💡 Tips for Effective Demos

1. **Pre-start the demo** before your presentation (saves 2-3 minutes)
2. **Have Swagger open** in multiple tabs for different tenants
3. **Prepare specific use cases** relevant to your audience
4. **Show the code** in VSCode to demonstrate quality
5. **Highlight multi-tenancy** - big selling point for SaaS
6. **Demonstrate webhooks** for enterprise integration needs
7. **Show health endpoints** for DevOps/infrastructure discussions
8. **Export a plan to PDF** - tangible deliverable for end users

## 📈 What to Emphasize

### For Business Stakeholders
- ✅ Multi-tenant white-label platform (sell to multiple clients)
- ✅ AI-powered personalization (competitive advantage)
- ✅ Complete user onboarding flow (proven UX)
- ✅ Export & analytics features (user value)
- ✅ Webhook integrations (extensibility)

### For Technical Teams
- ✅ Clean architecture (NestJS, Prisma, TypeScript)
- ✅ Comprehensive API documentation (Swagger/OpenAPI)
- ✅ Production-ready patterns (health checks, logging, monitoring)
- ✅ Type-safe DTOs with validation
- ✅ Background job processing (BullMQ)
- ✅ Security best practices (JWT, rate limiting, helmet)
- ✅ Database optimization (indexes, migrations)
- ✅ Containerized deployment (Docker, Docker Compose)
- ✅ Infrastructure as Code ready (Terraform modules exist)

### For Investors/Partners
- ✅ Scalable multi-tenant SaaS architecture
- ✅ AI integration (Google Gemini)
- ✅ Multiple revenue streams (subscription tiers)
- ✅ White-label capabilities (B2B2C model)
- ✅ Modern tech stack (attractive to developers)
- ✅ Cloud-native design (AWS/any cloud)

## 🎯 Next Steps After Demo

1. **Share Swagger URL** for API exploration
2. **Provide demo credentials** for async testing
3. **Show GitHub repository** (if applicable)
4. **Discuss customization** for specific niches
5. **Present pricing models** for white-label licensing
6. **Schedule technical deep-dive** with engineering teams
7. **Provide architecture diagrams** for infrastructure discussions

## 📝 Notes

- This is a **DEMO ENVIRONMENT** - not for production use
- All data is **reset on restart** (unless volumes are preserved)
- AI features require **valid Google AI API key**
- Emails are **logged to console** (no real SMTP in demo)
- Payments are in **test mode** (Stripe test keys)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `docker-compose -f docker-compose.demo.yml logs`
3. Ensure all prerequisites are met
4. Try a fresh start: `./stop-demo.sh && ./start-demo.sh`

---

**Made with ❤️ by the PlanMaker Team**

Ready to transform activity planning with AI! 🚀
