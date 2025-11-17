# PlanMaker SaaS - AWS Infrastructure

This directory contains Terraform configurations for deploying PlanMaker SaaS to AWS.

## Architecture Overview

### Components

- **VPC**: Multi-AZ VPC with public, private, and database subnets
- **ECS Fargate**: Containerized API and Worker services
- **RDS PostgreSQL**: Multi-AZ database with automatic backups
- **ElastiCache Redis**: Redis cluster for caching and queues
- **Application Load Balancer**: HTTP/HTTPS traffic distribution
- **S3 + CloudFront**: Static asset storage and CDN
- **Secrets Manager**: Secure credential storage
- **CloudWatch**: Logs, metrics, and alarms

### Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          VPC (10.0.0.0/16)                  │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │  Public Subnets  │  │ Private Subnets  │  │  Database │ │
│  │   (10.0.0/24)    │  │   (10.0.10/24)   │  │  Subnets  │ │
│  │                  │  │                  │  │ (10.0.20) │ │
│  │  - ALB           │  │  - ECS Tasks     │  │  - RDS    │ │
│  │  - NAT Gateway   │  │  - Redis         │  │           │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.5.0
3. **AWS CLI** configured with credentials
4. **Docker images** pushed to ECR or Docker Hub

## Quick Start

### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 2. Configure Environment

Copy and edit the example variables:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
```

### 3. Plan Deployment

```bash
terraform plan -var-file="environments/dev/terraform.tfvars"
```

### 4. Deploy Infrastructure

```bash
terraform apply -var-file="environments/dev/terraform.tfvars"
```

## Environment-Specific Deployment

### Development

```bash
terraform workspace select dev || terraform workspace new dev
terraform apply -var-file="environments/dev/terraform.tfvars"
```

### Staging

```bash
terraform workspace select staging || terraform workspace new staging
terraform apply -var-file="environments/staging/terraform.tfvars"
```

### Production

```bash
terraform workspace select prod || terraform workspace new prod
terraform apply -var-file="environments/prod/terraform.tfvars"
```

## Module Structure

```
terraform/
├── main.tf                 # Main configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── terraform.tfvars.example # Example configuration
├── environments/           # Environment-specific configs
│   ├── dev/
│   ├── staging/
│   └── prod/
└── modules/               # Reusable modules
    ├── vpc/               # Networking
    ├── ecs/               # Container services
    ├── rds/               # PostgreSQL database
    ├── elasticache/       # Redis cache
    ├── s3/                # Object storage
    ├── alb/               # Load balancer
    ├── cloudwatch/        # Monitoring
    └── secrets/           # Secrets management
```

## Cost Estimation

### Development Environment

| Service | Instance Type | Monthly Cost (est.) |
|---------|--------------|---------------------|
| ECS Fargate | 0.25 vCPU, 0.5 GB | $15 |
| RDS | db.t4g.micro | $15 |
| ElastiCache | cache.t4g.micro | $12 |
| NAT Gateway | 1 gateway | $35 |
| ALB | Standard | $20 |
| **Total** | | **~$97/month** |

### Production Environment

| Service | Instance Type | Monthly Cost (est.) |
|---------|--------------|---------------------|
| ECS Fargate | 6 vCPU, 12 GB | $180 |
| RDS | db.r6g.xlarge, Multi-AZ | $580 |
| ElastiCache | cache.r6g.xlarge x3 | $450 |
| NAT Gateway | 3 gateways | $105 |
| ALB | Standard | $20 |
| Data Transfer | 500 GB/month | $45 |
| **Total** | | **~$1,380/month** |

## Security Features

- ✅ VPC with private subnets for services
- ✅ Security groups with least privilege
- ✅ Encrypted data at rest (RDS, Redis, S3)
- ✅ Encrypted data in transit (TLS/SSL)
- ✅ Secrets Manager for credential management
- ✅ VPC Flow Logs enabled
- ✅ CloudWatch logging for all services
- ✅ IAM roles with minimal permissions

## Monitoring & Alerts

### CloudWatch Alarms

- CPU utilization > 80%
- Memory utilization > 80%
- Database connections > 80%
- API error rate > 5%
- Response time > 1s

### Dashboards

- ECS service metrics
- RDS performance
- Redis cache hit rate
- ALB request metrics

## Backup & Disaster Recovery

### Automated Backups

- **RDS**: Daily automated backups, 30-day retention
- **Redis**: Daily snapshots, 5-day retention

### Point-in-Time Recovery

- RDS supports PITR up to backup retention period

### Multi-Region

To deploy to multiple regions:

```bash
# Deploy to us-west-2
terraform apply -var="aws_region=us-west-2" -var-file="environments/prod/terraform.tfvars"
```

## Maintenance

### Updating Infrastructure

```bash
# Pull latest changes
git pull origin main

# Plan changes
terraform plan

# Apply changes
terraform apply
```

### Scaling Services

Edit your `terraform.tfvars`:

```hcl
api_desired_count = 10  # Scale API to 10 tasks
```

Then apply:

```bash
terraform apply
```

### Database Migration

```bash
# Connect to RDS
aws rds describe-db-instances --db-instance-identifier planmaker-prod-postgres

# Run migrations via ECS task
aws ecs run-task \
  --cluster planmaker-prod-cluster \
  --task-definition planmaker-prod-api \
  --overrides '{"containerOverrides": [{"name":"api","command":["npm","run","migrate"]}]}'
```

## Troubleshooting

### ECS Tasks Not Starting

Check CloudWatch logs:

```bash
aws logs tail /ecs/planmaker-prod-api --follow
```

### Database Connection Issues

Verify security group rules:

```bash
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### High Costs

Use Cost Explorer to identify expensive resources:

```bash
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

## Cleanup

To destroy all infrastructure:

```bash
# WARNING: This will delete everything!
terraform destroy -var-file="environments/dev/terraform.tfvars"
```

## Support

For issues or questions:

- GitHub Issues: https://github.com/your-org/plan-maker
- Documentation: https://docs.planmaker.io
- Email: support@planmaker.io
