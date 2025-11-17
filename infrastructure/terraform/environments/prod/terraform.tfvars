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
