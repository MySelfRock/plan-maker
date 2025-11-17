# PlanMaker SaaS - Deployment Guide

Complete step-by-step guide for deploying PlanMaker SaaS to AWS.

## Prerequisites

### 1. AWS Account Setup

```bash
# Install AWS CLI
brew install awscli  # macOS
# or download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

### 2. Terraform Installation

```bash
# Install Terraform
brew install terraform  # macOS
# or download from: https://www.terraform.io/downloads

# Verify installation
terraform version
```

### 3. Docker Images

Build and push your Docker images to ECR or Docker Hub:

```bash
# Build API image
cd packages/api
docker build -t planmaker/api:latest .

# Build Worker image
cd packages/worker
docker build -t planmaker/worker:latest .

# Push to ECR (create ECR repositories first)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker tag planmaker/api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker/api:v1.0.0
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker/api:v1.0.0
```

## Deployment Steps

### Step 1: Setup Backend (One-time)

```bash
cd infrastructure/terraform

# Setup S3 backend for state management
./scripts/setup-backend.sh dev

# The script will output the backend configuration
# Add it to your main.tf backend block
```

### Step 2: Configure Variables

```bash
# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vi terraform.tfvars

# Required variables:
# - aws_region
# - environment
# - domain_name (optional, for HTTPS)
# - gemini_api_key (Google Gemini API key)
# - smtp_* (SMTP configuration for emails)
```

### Step 3: Create SSL Certificate (Optional but Recommended)

```bash
# Request certificate in AWS Certificate Manager
aws acm request-certificate \
  --domain-name api.planmaker.io \
  --validation-method DNS \
  --region us-east-1

# Validate the certificate via DNS
# Add the CNAME records provided by ACM to your DNS

# Get certificate ARN and add to terraform.tfvars
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/abc123"
```

### Step 4: Initialize Terraform

```bash
# Initialize Terraform
terraform init

# Create or select workspace
terraform workspace new dev  # or staging, prod
terraform workspace select dev
```

### Step 5: Plan Deployment

```bash
# Review what will be created
terraform plan -var-file="environments/dev/terraform.tfvars" -out=dev.tfplan

# Review the plan carefully
# Check for any errors or unexpected changes
```

### Step 6: Deploy Infrastructure

```bash
# Apply the plan
terraform apply dev.tfplan

# This will create:
# - VPC with 3 AZs
# - RDS PostgreSQL database
# - ElastiCache Redis cluster
# - ECS Fargate cluster
# - Application Load Balancer
# - S3 bucket + CloudFront CDN
# - CloudWatch alarms and dashboards
# - IAM roles and security groups

# Deployment takes ~15-20 minutes
```

### Step 7: Get Outputs

```bash
# Get deployment outputs
terraform output

# Important outputs:
# - alb_dns_name: Load balancer DNS name
# - rds_endpoint: Database endpoint
# - redis_endpoint: Redis endpoint
# - cloudfront_domain_name: CDN domain name
```

### Step 8: Database Migration

```bash
# Run database migrations
./scripts/migrate-db.sh dev

# Or manually via ECS task:
aws ecs run-task \
  --cluster planmaker-dev-cluster \
  --task-definition planmaker-dev-api \
  --launch-type FARGATE \
  --network-configuration "..." \
  --overrides '{"containerOverrides": [{"name":"api","command":["npm","run","migrate"]}]}'
```

### Step 9: Configure DNS (Optional)

```bash
# Create Route53 record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.planmaker.io",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "ALB_DNS_NAME"}]
      }
    }]
  }'
```

### Step 10: Verify Deployment

```bash
# Check API health
curl http://YOUR_ALB_DNS/health

# Expected response:
{
  "status": "ok",
  "info": {
    "database": {"status": "up"},
    "memory_heap": {"status": "up"},
    "memory_rss": {"status": "up"}
  }
}

# Check Swagger docs
open http://YOUR_ALB_DNS/api/docs
```

## Environment-Specific Deployments

### Development

```bash
terraform workspace select dev
terraform apply -var-file="environments/dev/terraform.tfvars"
```

### Staging

```bash
terraform workspace select staging
terraform apply -var-file="environments/staging/terraform.tfvars"
```

### Production

```bash
terraform workspace select prod
terraform apply -var-file="environments/prod/terraform.tfvars"
```

## Post-Deployment Tasks

### 1. Configure Secrets

Update secrets in AWS Secrets Manager:

```bash
# Update Gemini API key
aws secretsmanager update-secret \
  --secret-id planmaker-prod/app/secrets \
  --secret-string '{"GEMINI_API_KEY":"your-actual-key"}'

# Update SMTP credentials
aws secretsmanager update-secret \
  --secret-id planmaker-prod/app/secrets \
  --secret-string '{"SMTP_PASSWORD":"your-smtp-password"}'
```

### 2. Setup Monitoring

```bash
# Subscribe to CloudWatch alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:planmaker-prod-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription via email
```

### 3. Enable CloudWatch Logs Insights

```bash
# Create log insights queries
aws logs put-query-definition \
  --name "API Errors" \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc'
```

## Updating Infrastructure

### Update Docker Images

```bash
# Build new images
docker build -t planmaker/api:v1.1.0 .

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker/api:v1.1.0

# Update terraform.tfvars
api_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker/api:v1.1.0"

# Apply changes
terraform apply -var-file="environments/prod/terraform.tfvars"
```

### Scale Services

```bash
# Edit terraform.tfvars
api_desired_count = 10
api_max_capacity  = 20

# Apply changes
terraform apply -var-file="environments/prod/terraform.tfvars"
```

### Update Database

```bash
# Upgrade RDS instance class
db_instance_class = "db.r6g.2xlarge"

# Apply changes
terraform apply -var-file="environments/prod/terraform.tfvars"
```

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check task logs
aws logs tail /ecs/planmaker-prod-api --follow

# Describe task
aws ecs describe-tasks \
  --cluster planmaker-prod-cluster \
  --tasks TASK_ARN

# Common issues:
# - Image not found: Check ECR repository and image tag
# - Secrets not accessible: Check IAM role permissions
# - Health check failing: Check /health/ready endpoint
```

### Database Connection Issues

```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx

# Test connection from ECS task
aws ecs execute-command \
  --cluster planmaker-prod-cluster \
  --task TASK_ARN \
  --container api \
  --interactive \
  --command "/bin/sh"

# Then inside container:
nc -zv DATABASE_HOST 5432
```

### High Costs

```bash
# Analyze costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Identify expensive resources:
# - NAT Gateway: Consider using fewer AZs in dev
# - RDS: Use smaller instance in dev/staging
# - ElastiCache: Use t4g instances in dev
```

## Disaster Recovery

### Backup Verification

```bash
# List RDS snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier planmaker-prod-postgres

# List Redis snapshots
aws elasticache describe-snapshots \
  --cache-cluster-id planmaker-prod-redis
```

### Restore from Backup

```bash
# Restore RDS from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier planmaker-prod-postgres-restored \
  --db-snapshot-identifier snapshot-id

# Restore Redis from snapshot
aws elasticache create-cache-cluster \
  --cache-cluster-id planmaker-prod-redis-restored \
  --snapshot-name snapshot-name
```

## Cleanup

To destroy all infrastructure:

```bash
# WARNING: This will delete everything!
terraform destroy -var-file="environments/dev/terraform.tfvars"

# Confirm by typing 'yes'
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/plan-maker/issues
- Documentation: https://docs.planmaker.io
- Email: support@planmaker.io
