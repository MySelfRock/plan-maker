# Production Environment Configuration
aws_region  = "us-east-1"
environment = "prod"
domain_name = "api.planmaker.io"

# ECS - Production sizing
api_cpu           = 2048
api_memory        = 4096
api_desired_count = 5
api_min_capacity  = 3
api_max_capacity  = 20

worker_cpu           = 1024
worker_memory        = 2048
worker_desired_count = 3

# RDS - Production sizing
db_instance_class        = "db.r6g.xlarge"
db_allocated_storage     = 200
db_max_allocated_storage = 1000
db_backup_retention_days = 30
db_multi_az              = true

# Redis - Production sizing
redis_node_type       = "cache.r6g.xlarge"
redis_num_cache_nodes = 3

enable_enhanced_monitoring = true
log_retention_days         = 90

# Docker Images (replace with your ECR repository)
api_image    = "123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker/api:v1.0.0"
worker_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/planmaker/worker:v1.0.0"

# External API Keys (provide via environment variables or AWS Secrets Manager)
# gemini_api_key       = "your-gemini-api-key"
# google_client_id     = "your-google-client-id"
# google_client_secret = "your-google-client-secret"

# SMTP Configuration (e.g., AWS SES, SendGrid, etc.)
# smtp_host     = "email-smtp.us-east-1.amazonaws.com"
# smtp_port     = "587"
# smtp_user     = "your-smtp-user"
# smtp_password = "your-smtp-password"
email_from = "noreply@planmaker.io"

# Monitoring
# sentry_dsn = "https://your-sentry-dsn@sentry.io/project-id"

# CORS
cors_origins = "https://app.planmaker.io,https://www.planmaker.io"

# SSL Certificate (create in AWS Certificate Manager first)
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/abc123"

# Alerts
alert_email = "alerts@planmaker.io"
