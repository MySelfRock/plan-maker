# @planmaker/worker - Background Job Processor

Background worker service for processing async jobs in the PlanMaker SaaS platform.

## 🎯 Features

- **Plan Generation** - Processes AI-powered plan generation asynchronously
- **Email Notifications** - Sends transactional emails (plan ready, PDF ready, etc.)
- **PDF Export** - Generates and uploads PDF exports of plans
- **Plan Adjustment** - Adaptive plan modifications based on user feedback

## 🏗️ Architecture

Built with:
- **BullMQ** - Robust Redis-based job queue
- **Prisma** - Database ORM
- **Gemini AI** - Google's generative AI for plan generation
- **Nodemailer** - Email sending
- **PDFKit** - PDF generation
- **Winston** - Structured logging

## 📦 Queues

### 1. `plan-generation`
Generates personalized plans using AI.

**Job Data:**
```typescript
{
  userId: string;
  tenantId: string;
  profileId: string;
  planType: string;
  startDate: Date;
  weeks?: number;
  templateId?: string;
}
```

**Process:**
1. Fetch user profile and template
2. Get available exercises for the niche
3. Call Gemini AI with structured prompt
4. Parse and validate AI response
5. Save plan to database (plan → days → sessions)
6. Send notification email
7. Log event

**Concurrency:** 2 (AI calls are resource-intensive)

### 2. `email`
Sends emails using SMTP and Handlebars templates.

**Job Data:**
```typescript
{
  to: string;
  subject: string;
  template: string;
  context: any;
}
```

**Templates Available:**
- `plan-ready` - Plan generation completed
- `pdf-ready` - PDF export completed

**Concurrency:** 5

### 3. `pdf-export`
Generates PDF version of plans and uploads to S3/MinIO.

**Job Data:**
```typescript
{
  planId: string;
  userId: string;
  tenantId: string;
}
```

**Process:**
1. Fetch plan with all details
2. Generate PDF using PDFKit
3. Upload to S3/MinIO
4. Send email with download link
5. Log event

**Concurrency:** 3

### 4. `plan-adjustment`
Analyzes user feedback and adjusts upcoming sessions.

**Job Data:**
```typescript
{
  planId: string;
  sessionId: string;
  feedback: {
    rating?: number;
    difficulty?: number;
    notes?: string;
  };
}
```

**Triggers:**
- Rating < 3 (poor experience)
- Difficulty < 3 (too easy) or > 8 (too hard)

**Process:**
1. Analyze feedback
2. Get AI recommendations for adjustments
3. Store recommendations in plan metadata
4. (Future: apply to upcoming sessions)

**Concurrency:** 3

## 🚀 Usage

### Development

```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Edit .env and configure:
# - GEMINI_API_KEY (required)
# - SMTP credentials (for emails)
# - Other settings as needed

# Start worker
yarn dev
```

### Production

```bash
# Build
yarn build

# Start
yarn start:prod
```

### Docker

```bash
docker build -t planmaker-worker .
docker run -d \
  --env-file .env \
  --name planmaker-worker \
  planmaker-worker
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | - | ✅ |
| `GEMINI_MODEL` | Gemini model to use | `gemini-pro` | ❌ |
| `WORKER_CONCURRENCY` | Max concurrent jobs per queue | `5` | ❌ |
| `LOG_LEVEL` | Winston log level | `info` | ❌ |
| `SMTP_HOST` | SMTP server host | - | ⚠️ |
| `SMTP_PORT` | SMTP server port | `587` | ⚠️ |
| `SMTP_USER` | SMTP username | - | ⚠️ |
| `SMTP_PASSWORD` | SMTP password | - | ⚠️ |
| `EMAIL_FROM` | From email address | `noreply@planmaker.io` | ❌ |
| `S3_ENDPOINT` | S3/MinIO endpoint | - | ✅ |
| `S3_ACCESS_KEY_ID` | S3 access key | - | ✅ |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | - | ✅ |
| `USE_MINIO` | Use MinIO instead of AWS S3 | `false` | ❌ |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:3001` | ❌ |

⚠️ = Required for email functionality

### Concurrency Tuning

Adjust `WORKER_CONCURRENCY` based on your resources:

- **Low (1-2)**: Limited resources, AI-heavy workloads
- **Medium (3-5)**: Balanced workloads
- **High (10+)**: High throughput, simple jobs (emails)

Can be set per-queue in code if needed.

## 📧 Email Templates

Templates are located in `src/templates/` and use Handlebars syntax.

### Creating a New Template

1. Create `src/templates/my-template.hbs`
2. Use Handlebars syntax: `{{variable}}`
3. Use in code:
   ```typescript
   await emailService.sendEmail({
     to: 'user@example.com',
     subject: 'My Subject',
     template: 'my-template',
     context: { variable: 'value' }
   });
   ```

### Available Templates

- **plan-ready.hbs** - Notifies user their plan is ready
  - Variables: `userName`, `planName`, `planUrl`
- **pdf-ready.hbs** - Notifies user their PDF is ready
  - Variables: `userName`, `planName`, `pdfUrl`

## 📊 Monitoring

### Logs

Structured JSON logs with Winston:

```bash
# Development (console)
yarn dev

# Production (console + files)
# logs/error.log - errors only
# logs/combined.log - all logs
```

### Job Status

Jobs are tracked in Redis:
- Last 100 completed jobs kept
- Last 500 failed jobs kept
- Automatic cleanup

### Metrics to Monitor

- Queue depth (jobs waiting)
- Processing rate (jobs/minute)
- Error rate
- AI API latency
- Email delivery rate

## 🔧 Troubleshooting

### Worker not processing jobs

1. Check Redis connection:
   ```bash
   redis-cli ping
   ```

2. Check worker logs:
   ```bash
   docker logs planmaker-worker
   ```

3. Verify queue has jobs:
   ```bash
   redis-cli
   > LLEN bull:plan-generation:wait
   ```

### Gemini API errors

- Check API key is valid
- Check quota limits
- Check network connectivity
- See logs for detailed error messages

### Email not sending

- Verify SMTP credentials
- Check SMTP server allows connections
- Test with a simple SMTP client
- Check spam folders

### PDF generation fails

- Check S3/MinIO is accessible
- Verify credentials
- Check bucket exists
- Check disk space

## 🏃 Running Multiple Workers

For high availability, run multiple worker instances:

```bash
# Instance 1
WORKER_CONCURRENCY=3 yarn start

# Instance 2 (different machine)
WORKER_CONCURRENCY=3 yarn start
```

BullMQ automatically distributes jobs across workers.

## 🧪 Testing

```bash
# Unit tests
yarn test

# Integration tests (requires Redis)
yarn test:integration
```

## 📝 Adding a New Queue/Processor

1. Create processor file:
   ```typescript
   // src/processors/my-job.processor.ts
   export function createMyJobWorker(redisConnection: any): Worker {
     const worker = new Worker(
       'my-queue',
       async (job) => {
         // Process job
         return { success: true };
       },
       { connection: redisConnection }
     );
     return worker;
   }
   ```

2. Register in `src/main.ts`:
   ```typescript
   const myWorker = createMyJobWorker(this.redisConnection);
   this.workers.push(myWorker);
   ```

3. Add to API's QueueService:
   ```typescript
   // packages/api/src/common/queue/queue.service.ts
   async addMyJob(data: any): Promise<string> {
     const queue = this.queues.get('my-queue');
     const job = await queue.add('my-job', data);
     return job.id;
   }
   ```

## 🔐 Security

- Store credentials in environment variables
- Use secure SMTP connections (TLS)
- Validate all job data
- Rate limit external API calls (Gemini)
- Sanitize user input before PDF generation

## 📚 Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Nodemailer Guide](https://nodemailer.com/)
- [PDFKit Documentation](https://pdfkit.org/)

---

Built with ❤️ as part of PlanMaker SaaS
