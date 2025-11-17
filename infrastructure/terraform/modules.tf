# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  log_retention_days = var.log_retention_days

  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  name_prefix            = local.name_prefix
  vpc_id                 = module.vpc.vpc_id
  database_subnet_ids    = module.vpc.database_subnet_ids
  ecs_security_group_id  = module.ecs.security_group_id

  instance_class             = var.db_instance_class
  allocated_storage          = var.db_allocated_storage
  max_allocated_storage      = var.db_max_allocated_storage
  backup_retention_days      = var.db_backup_retention_days
  multi_az                   = var.db_multi_az
  enable_performance_insights = var.enable_enhanced_monitoring
  enable_enhanced_monitoring = var.enable_enhanced_monitoring
  
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

  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes

  tags = local.common_tags

  depends_on = [module.ecs]
}

# Secrets Module - Application Secrets
module "secrets" {
  source = "./modules/secrets"

  name_prefix = local.name_prefix
  environment = var.environment

  tags = local.common_tags
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  name_prefix         = local.name_prefix
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  public_subnet_ids   = module.vpc.public_subnet_ids

  # API Configuration
  api_image            = "${var.ecr_repository_url}/api:${var.image_tag}"
  api_cpu              = var.api_cpu
  api_memory           = var.api_memory
  api_desired_count    = var.api_desired_count
  api_min_capacity     = var.api_min_capacity
  api_max_capacity     = var.api_max_capacity

  # Worker Configuration
  worker_image         = "${var.ecr_repository_url}/worker:${var.image_tag}"
  worker_cpu           = var.worker_cpu
  worker_memory        = var.worker_memory
  worker_desired_count = var.worker_desired_count

  # Environment variables (from Secrets Manager)
  database_secret_arn  = module.rds.secret_arn
  redis_secret_arn     = module.elasticache.secret_arn
  app_secrets_arn      = module.secrets.secrets_arn

  # Load balancer target group
  target_group_arn     = module.alb.target_group_arn

  log_retention_days   = var.log_retention_days

  tags = local.common_tags

  depends_on = [module.alb]
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  certificate_arn    = var.certificate_arn
  allowed_cidr_blocks = var.allowed_cidr_blocks

  tags = local.common_tags
}

# S3 and CloudFront Module
module "s3" {
  source = "./modules/s3"

  name_prefix     = local.name_prefix
  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn

  tags = local.common_tags
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  name_prefix = local.name_prefix
  
  # ECS Resources
  ecs_cluster_name     = module.ecs.cluster_name
  api_service_name     = module.ecs.api_service_name
  worker_service_name  = module.ecs.worker_service_name

  # RDS Resources
  rds_instance_id      = module.rds.instance_id

  # ElastiCache Resources
  redis_cluster_id     = module.elasticache.cluster_id

  # ALB Resources
  alb_arn_suffix       = module.alb.arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix

  # SNS topic for alerts
  alert_email          = var.alert_email

  tags = local.common_tags
}
