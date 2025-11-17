# Development Environment Configuration
aws_region  = "us-east-1"
environment = "dev"
domain_name = "dev-api.planmaker.io"

# ECS - Development sizing (minimal)
api_cpu           = 256
api_memory        = 512
api_desired_count = 1
api_min_capacity  = 1
api_max_capacity  = 2

worker_cpu           = 256
worker_memory        = 512
worker_desired_count = 1

# RDS - Development sizing
db_instance_class        = "db.t4g.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 50
db_backup_retention_days = 3
db_multi_az              = false

# Redis - Development sizing
redis_node_type       = "cache.t4g.micro"
redis_num_cache_nodes = 1

enable_enhanced_monitoring = false
log_retention_days         = 7
