# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  log_retention_days = var.log_retention_days

  tags = local.common_tags
}

# Application Load Balancer Module (before ECS)
module "alb" {
  source = "./modules/alb"

  name_prefix         = local.name_prefix
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  certificate_arn     = var.certificate_arn
  allowed_cidr_blocks = var.allowed_cidr_blocks
  deletion_protection = var.environment == "prod" ? true : false

  tags = local.common_tags
}

# Secrets Module
module "secrets" {
  source = "./modules/secrets"

  name_prefix = local.name_prefix
  environment = var.environment

  # External API keys
  gemini_api_key       = var.gemini_api_key
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  # SMTP Configuration
  smtp_host     = var.smtp_host
  smtp_port     = var.smtp_port
  smtp_user     = var.smtp_user
  smtp_password = var.smtp_password
  email_from    = var.email_from

  # Monitoring
  sentry_dsn = var.sentry_dsn

  # CORS
  cors_origins = var.cors_origins

  tags = local.common_tags
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  name_prefix        = local.name_prefix
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  # ALB Configuration
  alb_security_group_id = module.alb.security_group_id
  target_group_arn      = module.alb.target_group_arn

  # API Configuration
  api_image         = var.api_image
  api_cpu           = var.api_cpu
  api_memory        = var.api_memory
  api_desired_count = var.api_desired_count
  api_min_capacity  = var.api_min_capacity
  api_max_capacity  = var.api_max_capacity

  # Worker Configuration
  worker_image         = var.worker_image
  worker_cpu           = var.worker_cpu
  worker_memory        = var.worker_memory
  worker_desired_count = var.worker_desired_count

  # Secrets
  database_secret_arn = module.rds.secret_arn
  redis_secret_arn    = module.elasticache.secret_arn
  app_secrets_arn     = module.secrets.secrets_arn

  log_retention_days = var.log_retention_days

  tags = local.common_tags

  depends_on = [module.rds, module.elasticache, module.secrets]
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  database_subnet_ids   = module.vpc.database_subnet_ids
  ecs_security_group_id = module.ecs.security_group_id

  instance_class              = var.db_instance_class
  allocated_storage           = var.db_allocated_storage
  max_allocated_storage       = var.db_max_allocated_storage
  backup_retention_days       = var.db_backup_retention_days
  multi_az                    = var.db_multi_az
  enable_performance_insights = var.enable_enhanced_monitoring
  enable_enhanced_monitoring  = var.enable_enhanced_monitoring

  deletion_protection = var.environment == "prod" ? true : false
  skip_final_snapshot = var.environment != "prod" ? true : false

  tags = local.common_tags

  depends_on = [module.ecs]
}

# ElastiCache Module
module "elasticache" {
  source = "./modules/elasticache"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.ecs.security_group_id

  node_type       = var.redis_node_type
  num_cache_nodes = var.redis_num_cache_nodes

  tags = local.common_tags

  depends_on = [module.ecs]
}

# S3 and CloudFront Module
module "s3" {
  source = "./modules/s3"

  name_prefix     = local.name_prefix
  certificate_arn = var.certificate_arn

  tags = local.common_tags
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  name_prefix = local.name_prefix

  # ECS Resources
  ecs_cluster_name    = module.ecs.cluster_name
  api_service_name    = module.ecs.api_service_name
  worker_service_name = module.ecs.worker_service_name

  # RDS Resources
  rds_instance_id = module.rds.instance_id

  # ElastiCache Resources
  redis_cluster_id = module.elasticache.cluster_id

  # ALB Resources
  alb_arn_suffix          = module.alb.arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix

  # SNS topic for alerts
  alert_email = var.alert_email

  tags = local.common_tags
}
