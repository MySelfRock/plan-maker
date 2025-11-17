# 🚀 Quick Start - AWS Deployment

Deploy PlanMaker SaaS to AWS in **less than 30 minutes** using this streamlined guide.

## Prerequisites (5 minutes)

### 1. Install Required Tools

```bash
# macOS
brew install terraform awscli docker

# Or download manually:
# Terraform: https://www.terraform.io/downloads
# AWS CLI: https://aws.amazon.com/cli/
# Docker Desktop: https://www.docker.com/products/docker-desktop
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Enter:
- **AWS Access Key ID**: (from AWS IAM)
- **AWS Secret Access Key**: (from AWS IAM)
- **Default region**: `us-east-1`
- **Default output format**: `json`

### 3. Verify Setup

```bash
# Check installations
terraform version  # Should be >= 1.5.0
aws --version
docker --version

# Test AWS access
aws sts get-caller-identity
```

## Development Environment (10 minutes)

### Step 1: Validate Prerequisites

```bash
cd infrastructure/terraform
make validate-env ENV=dev
```

This checks:
- ✅ All tools installed
- ✅ AWS credentials valid
- ✅ Terraform configuration correct
- ✅ Environment files present

### Step 2: Configure Variables

Edit `environments/dev/terraform.tfvars`:

```hcl
# Required: Update these
gemini_api_key = "your-google-ai-api-key"  # Get from: https://makersuite.google.com/app/apikey
smtp_host      = "smtp.sendgrid.net"       # Your SMTP server
smtp_user      = "apikey"                  # Your SMTP user
smtp_password  = "your-smtp-password"      # Your SMTP password
alert_email    = "your-email@domain.com"   # For infrastructure alerts

# Optional: Update if needed
api_image    = "123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker-api:v1.0.0"
worker_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker-worker:v1.0.0"
```

### Step 3: Build and Push Docker Images

```bash
# This builds API and Worker images and pushes to ECR
make push-images ENV=dev VERSION=v1.0.0
```

**What this does:**
1. Creates ECR repositories (if needed)
2. Builds Docker images
3. Pushes to AWS ECR
4. Shows image URIs for Terraform

**Update terraform.tfvars** with the output image URIs.

### Step 4: Initialize Terraform

```bash
make init
```

### Step 5: Preview Changes

```bash
make plan ENV=dev
```

Review the resources that will be created:
- VPC with 3 availability zones
- RDS PostgreSQL database
- ElastiCache Redis cluster
- ECS Fargate services (API + Worker)
- Application Load Balancer
- S3 bucket + CloudFront
- CloudWatch alarms
- Secrets Manager

**Estimated cost: ~$95-140/month**

### Step 6: Deploy!

```bash
make apply ENV=dev
```

Confirm with `yes` when prompted.

**Deployment takes ~15-20 minutes** ☕

## What Gets Created

### Network Infrastructure
- **VPC** (10.0.0.0/16) across 3 AZs
- **Subnets**: Public, Private, Database
- **NAT Gateways** for outbound internet
- **Security Groups** with least-privilege access

### Compute
- **ECS Fargate Cluster** with Container Insights
- **API Service**: 1 task (auto-scales 1-2)
- **Worker Service**: 1 task for background jobs
- **Application Load Balancer** with health checks

### Data Storage
- **RDS PostgreSQL 15.4** (db.t4g.micro)
  - 20GB storage (auto-scales to 50GB)
  - Automated daily backups (3 days retention)
  - Encryption at rest

- **ElastiCache Redis 7.1** (cache.t4g.micro)
  - Single node for dev
  - Auth token enabled
  - Encryption in transit

### Storage & CDN
- **S3 Bucket** for assets and exports
  - Versioning enabled
  - Encryption at rest
  - Lifecycle policies (90d → IA, 180d → Glacier)

- **CloudFront** CDN distribution
  - HTTPS only
  - Cached for 1 day

### Security & Monitoring
- **Secrets Manager** for sensitive credentials
  - Auto-generated JWT secrets
  - Database credentials
  - API keys (Gemini, SMTP)

- **CloudWatch** monitoring
  - Log aggregation
  - 9 critical alarms (CPU, memory, errors)
  - Email alerts via SNS

## After Deployment

### Get Access Information

```bash
make output ENV=dev
```

You'll see:
```
alb_dns_name = "planmaker-dev-alb-123456789.us-east-1.elb.amazonaws.com"
api_url      = "http://planmaker-dev-alb-123456789.us-east-1.elb.amazonaws.com/api/v1"
cloudfront_domain = "d1234567890abc.cloudfront.net"
```

### Test the API

```bash
# Health check
curl http://<alb-dns-name>/api/v1/health

# Or use make command
make health ENV=dev
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

### Access Swagger Documentation

```
http://<alb-dns-name>/api/docs
```

### View Logs

```bash
# Stream API logs
make logs ENV=dev

# Or use AWS CLI directly
aws logs tail /aws/ecs/planmaker-dev-api --follow
```

### Run Database Migrations

Migrations run automatically on deployment, but to run manually:

```bash
make migrate ENV=dev
```

### Connect to ECS Task (Debugging)

```bash
make ssh ENV=dev
```

Requires AWS Session Manager plugin.

## Common Commands

```bash
# Validate environment before deployment
make validate-env ENV=dev

# Show deployment plan
make plan ENV=dev

# Deploy infrastructure
make apply ENV=dev

# Build & push new Docker images
make push-images VERSION=v1.1.0

# Complete deployment (images + infra)
make deploy ENV=dev

# Quick re-deploy (skip image build)
make quick-deploy ENV=dev

# Check deployment status
make status ENV=dev

# Show outputs
make output ENV=dev

# Check API health
make health ENV=dev

# View logs
make logs ENV=dev

# Show cost estimate
make cost-estimate ENV=dev

# Destroy everything
make destroy ENV=dev
```

## Staging Environment

Deploy to staging with larger resources:

```bash
# Edit staging config
vi environments/staging/terraform.tfvars

# Deploy
make deploy ENV=staging
```

**Staging specs:**
- API: 512MB RAM, 1-4 tasks
- Worker: 512MB RAM, 1-2 tasks
- RDS: db.t4g.small, Multi-AZ
- Redis: 2 nodes

**Estimated cost: ~$215-310/month**

## Production Environment

Deploy to production with full redundancy:

```bash
# Edit production config
vi environments/prod/terraform.tfvars

# Validate thoroughly
make validate-env ENV=prod
make plan ENV=prod

# Deploy
make deploy ENV=prod
```

**Production specs:**
- API: 1GB RAM, 2-10 tasks
- Worker: 1GB RAM, 2-5 tasks
- RDS: db.r6g.large, Multi-AZ
- Redis: 3 nodes, automatic failover

**Estimated cost: ~$1,140-1,800/month**

## Continuous Deployment

### GitHub Actions

Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `GEMINI_API_KEY`
- `SMTP_PASSWORD`

Example workflow (`.github/workflows/deploy-dev.yml`):

```yaml
name: Deploy to Dev

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Deploy
        run: |
          cd infrastructure/terraform
          make push-images VERSION=${{ github.sha }}
          make apply-auto ENV=dev
```

## Troubleshooting

### Deployment Fails

```bash
# Check validation
make validate-env ENV=dev

# See detailed plan
make plan ENV=dev

# Check AWS CloudWatch Logs
aws logs tail /aws/ecs/planmaker-dev-api --since 1h
```

### Service Unhealthy

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster planmaker-dev \
  --services planmaker-dev-api

# Check task logs
make logs ENV=dev
```

### Database Connection Issues

```bash
# Verify security groups allow ECS → RDS
aws ec2 describe-security-groups --group-ids <rds-sg-id>

# Check Secrets Manager has DB credentials
aws secretsmanager get-secret-value \
  --secret-id planmaker-dev-database
```

### Cost Overruns

```bash
# Check current costs
make cost-estimate ENV=dev

# Scale down if needed (edit terraform.tfvars)
api_desired_count = 1  # Reduce from 2
api_max_capacity  = 2  # Reduce from 5

# Apply changes
make apply ENV=dev
```

## Cleanup

### Destroy Everything

```bash
make destroy ENV=dev
```

**Warning:** This deletes:
- All data in RDS (unless backup exists)
- All files in S3
- All logs in CloudWatch
- The entire infrastructure

### Partial Cleanup

To keep data but stop services:

```bash
# Scale to zero
aws ecs update-service \
  --cluster planmaker-dev \
  --service planmaker-dev-api \
  --desired-count 0

aws ecs update-service \
  --cluster planmaker-dev \
  --service planmaker-dev-worker \
  --desired-count 0
```

## Next Steps

1. **Setup Custom Domain**
   - Get SSL certificate from ACM
   - Add `certificate_arn` to terraform.tfvars
   - Point domain to ALB DNS

2. **Configure CI/CD**
   - Setup GitHub Actions
   - Automated deployments on merge

3. **Setup Monitoring Dashboard**
   - Import CloudWatch dashboard
   - Configure PagerDuty/Opsgenie alerts

4. **Performance Tuning**
   - Adjust auto-scaling policies
   - Optimize database queries
   - Configure CloudFront caching

5. **Backup & Disaster Recovery**
   - Test RDS snapshot restoration
   - Document recovery procedures
   - Setup cross-region replication

## Support

- **Documentation**: See [README.md](./README.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Terraform Docs**: https://registry.terraform.io/providers/hashicorp/aws
- **AWS Architecture**: Review `modules/` for detailed component docs

---

**Ready to deploy! 🚀**

For production deployments, review the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide for security best practices and compliance requirements.
