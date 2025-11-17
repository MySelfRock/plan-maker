variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for API service"
  type        = string
}

# API Configuration
variable "api_image" {
  description = "Docker image for API"
  type        = string
}

variable "api_cpu" {
  description = "CPU units for API"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory for API in MB"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Desired count of API tasks"
  type        = number
  default     = 2
}

variable "api_min_capacity" {
  description = "Minimum capacity for API auto-scaling"
  type        = number
  default     = 1
}

variable "api_max_capacity" {
  description = "Maximum capacity for API auto-scaling"
  type        = number
  default     = 10
}

# Worker Configuration
variable "worker_image" {
  description = "Docker image for Worker"
  type        = string
}

variable "worker_cpu" {
  description = "CPU units for Worker"
  type        = number
  default     = 256
}

variable "worker_memory" {
  description = "Memory for Worker in MB"
  type        = number
  default     = 512
}

variable "worker_desired_count" {
  description = "Desired count of Worker tasks"
  type        = number
  default     = 1
}

# Secrets
variable "database_secret_arn" {
  description = "ARN of database credentials secret"
  type        = string
}

variable "redis_secret_arn" {
  description = "ARN of Redis credentials secret"
  type        = string
}

variable "app_secrets_arn" {
  description = "ARN of application secrets"
  type        = string
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
