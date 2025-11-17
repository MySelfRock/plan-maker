# =========================================
# PlanMaker SaaS - Terraform Makefile
# =========================================
# Simplifies common Terraform operations
# for AWS infrastructure deployment
# =========================================

.PHONY: help init validate plan apply destroy push-images validate-env clean

# Default environment
ENV ?= dev

# AWS region
AWS_REGION ?= us-east-1

# Docker image version
VERSION ?= v1.0.0

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo ""
	@echo "$(BLUE)PlanMaker SaaS - Terraform Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC)"
	@echo "  make <target> [ENV=dev|staging|prod]"
	@echo ""
	@echo "$(GREEN)Targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make validate ENV=dev          # Validate dev environment"
	@echo "  make plan ENV=staging          # Plan staging deployment"
	@echo "  make apply ENV=prod            # Deploy to production"
	@echo "  make push-images VERSION=v1.1.0 # Push Docker images with version tag"
	@echo ""

init: ## Initialize Terraform
	@echo "$(BLUE)Initializing Terraform for $(ENV) environment...$(NC)"
	terraform init
	@echo "$(GREEN)✅ Terraform initialized$(NC)"

validate-env: ## Validate environment configuration
	@echo "$(BLUE)Validating $(ENV) environment...$(NC)"
	./scripts/validate-deployment.sh $(ENV)

validate: init ## Validate Terraform configuration
	@echo "$(BLUE)Validating Terraform configuration...$(NC)"
	terraform validate
	@echo "$(GREEN)✅ Configuration is valid$(NC)"

format: ## Format Terraform files
	@echo "$(BLUE)Formatting Terraform files...$(NC)"
	terraform fmt -recursive
	@echo "$(GREEN)✅ Files formatted$(NC)"

plan: validate-env ## Show deployment plan
	@echo "$(BLUE)Creating deployment plan for $(ENV)...$(NC)"
	terraform plan -var-file="environments/$(ENV)/terraform.tfvars"

apply: validate-env ## Apply infrastructure changes
	@echo "$(YELLOW)⚠️  Deploying to $(ENV) environment$(NC)"
	@echo "$(YELLOW)This will create/modify AWS resources and incur costs!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	terraform apply -var-file="environments/$(ENV)/terraform.tfvars"
	@echo "$(GREEN)✅ Deployment complete!$(NC)"

apply-auto: validate-env ## Apply without confirmation (use with caution)
	@echo "$(BLUE)Deploying to $(ENV) environment (auto-approve)...$(NC)"
	terraform apply -var-file="environments/$(ENV)/terraform.tfvars" -auto-approve
	@echo "$(GREEN)✅ Deployment complete!$(NC)"

destroy: ## Destroy infrastructure
	@echo "$(RED)⚠️  WARNING: This will DESTROY all resources in $(ENV)!$(NC)"
	@read -p "Type 'destroy-$(ENV)' to confirm: " confirm && [ "$$confirm" = "destroy-$(ENV)" ]
	terraform destroy -var-file="environments/$(ENV)/terraform.tfvars"
	@echo "$(GREEN)✅ Resources destroyed$(NC)"

output: ## Show Terraform outputs
	@echo "$(BLUE)Terraform outputs for $(ENV):$(NC)"
	terraform output

push-images: ## Build and push Docker images to ECR
	@echo "$(BLUE)Building and pushing Docker images ($(VERSION))...$(NC)"
	VERSION=$(VERSION) ./scripts/push-to-ecr.sh $(ENV)

workspace-select: ## Select Terraform workspace
	@echo "$(BLUE)Selecting workspace: $(ENV)$(NC)"
	terraform workspace select $(ENV) || terraform workspace new $(ENV)

workspace-list: ## List Terraform workspaces
	@echo "$(BLUE)Available workspaces:$(NC)"
	terraform workspace list

# Complete deployment workflow
deploy: validate-env push-images apply ## Complete deployment (validate, build, push, deploy)
	@echo "$(GREEN)✅ Complete deployment finished!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Check outputs: make output ENV=$(ENV)"
	@echo "  2. Verify health: curl https://<alb-url>/api/v1/health"
	@echo ""

# Quick deployment (assumes images already pushed)
quick-deploy: validate-env apply ## Quick deployment (skip image build)
	@echo "$(GREEN)✅ Quick deployment finished!$(NC)"

# Show cost estimate
cost-estimate: ## Show estimated monthly costs
	@echo "$(BLUE)Estimated monthly costs for $(ENV):$(NC)"
	@echo ""
	@if [ "$(ENV)" = "dev" ]; then \
		echo "  ECS Fargate:      ~$$30-50"; \
		echo "  RDS (t4g.micro):  ~$$15-20"; \
		echo "  ElastiCache:      ~$$15-20"; \
		echo "  ALB:              ~$$20-25"; \
		echo "  S3 + CloudFront:  ~$$5-10"; \
		echo "  Other:            ~$$10-15"; \
		echo "  ────────────────────────"; \
		echo "  $(YELLOW)Total: ~$$95-140/month$(NC)"; \
	elif [ "$(ENV)" = "staging" ]; then \
		echo "  ECS Fargate:      ~$$100-150"; \
		echo "  RDS (t4g.small):  ~$$30-40"; \
		echo "  ElastiCache:      ~$$30-40"; \
		echo "  ALB:              ~$$25-30"; \
		echo "  S3 + CloudFront:  ~$$10-20"; \
		echo "  Other:            ~$$20-30"; \
		echo "  ────────────────────────"; \
		echo "  $(YELLOW)Total: ~$$215-310/month$(NC)"; \
	elif [ "$(ENV)" = "prod" ]; then \
		echo "  ECS Fargate:      ~$$500-800"; \
		echo "  RDS (Multi-AZ):   ~$$300-500"; \
		echo "  ElastiCache:      ~$$150-200"; \
		echo "  ALB:              ~$$40-50"; \
		echo "  S3 + CloudFront:  ~$$50-100"; \
		echo "  Other:            ~$$100-150"; \
		echo "  ────────────────────────"; \
		echo "  $(YELLOW)Total: ~$$1,140-1,800/month$(NC)"; \
	fi
	@echo ""

# Show deployment status
status: ## Show deployment status
	@echo "$(BLUE)Deployment Status$(NC)"
	@echo ""
	@echo "Environment: $(ENV)"
	@echo "Region:      $(AWS_REGION)"
	@echo ""
	@terraform output 2>/dev/null || echo "$(YELLOW)No deployment found. Run 'make apply' first.$(NC)"

# Clean Terraform files
clean: ## Clean Terraform temporary files
	@echo "$(BLUE)Cleaning Terraform temporary files...$(NC)"
	rm -rf .terraform
	rm -f .terraform.lock.hcl
	rm -f terraform.tfstate.backup
	@echo "$(GREEN)✅ Cleaned$(NC)"

# Show logs
logs: ## Show ECS service logs (requires AWS CLI)
	@echo "$(BLUE)Fetching logs for $(ENV)...$(NC)"
	@echo "$(YELLOW)Note: This requires the deployment to be active$(NC)"
	aws logs tail /aws/ecs/planmaker-$(ENV)-api --follow --region $(AWS_REGION)

# SSH to ECS task (requires AWS CLI and Session Manager)
ssh: ## Connect to ECS task (requires Session Manager)
	@echo "$(BLUE)Connecting to ECS task...$(NC)"
	@TASK_ARN=$$(aws ecs list-tasks --cluster planmaker-$(ENV) --service-name planmaker-$(ENV)-api --region $(AWS_REGION) --query 'taskArns[0]' --output text); \
	if [ -z "$$TASK_ARN" ]; then \
		echo "$(RED)No running tasks found$(NC)"; \
		exit 1; \
	fi; \
	echo "Connecting to task: $$TASK_ARN"; \
	aws ecs execute-command \
		--cluster planmaker-$(ENV) \
		--task $$TASK_ARN \
		--container api \
		--command "/bin/sh" \
		--interactive \
		--region $(AWS_REGION)

# Database migration (run migrations on ECS)
migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations on $(ENV)...$(NC)"
	@TASK_ARN=$$(aws ecs list-tasks --cluster planmaker-$(ENV) --service-name planmaker-$(ENV)-api --region $(AWS_REGION) --query 'taskArns[0]' --output text); \
	aws ecs execute-command \
		--cluster planmaker-$(ENV) \
		--task $$TASK_ARN \
		--container api \
		--command "yarn prisma:migrate:prod" \
		--region $(AWS_REGION)
	@echo "$(GREEN)✅ Migrations complete$(NC)"

# Health check
health: ## Check API health
	@echo "$(BLUE)Checking API health...$(NC)"
	@ALB_DNS=$$(terraform output -raw alb_dns_name 2>/dev/null); \
	if [ -z "$$ALB_DNS" ]; then \
		echo "$(RED)Could not get ALB DNS. Is the infrastructure deployed?$(NC)"; \
		exit 1; \
	fi; \
	curl -s http://$$ALB_DNS/api/v1/health | jq . || echo "$(YELLOW)jq not installed, showing raw output:$(NC)" && curl http://$$ALB_DNS/api/v1/health
