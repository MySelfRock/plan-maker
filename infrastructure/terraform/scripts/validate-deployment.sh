#!/bin/bash

# =========================================
# Pre-Deployment Validation Script
# =========================================
# Validates that all requirements are met
# before deploying to AWS with Terraform
# =========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ENVIRONMENT="${1:-dev}"
ERRORS=0
WARNINGS=0

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Pre-Deployment Validation - ${ENVIRONMENT} Environment         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Function to check command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $2 is installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $2 is not installed${NC}"
        echo -e "   Install from: $3"
        ((ERRORS++))
        return 1
    fi
}

# Check prerequisites
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}1. Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

check_command "terraform" "Terraform" "https://www.terraform.io/downloads"
check_command "aws" "AWS CLI" "https://aws.amazon.com/cli/"
check_command "docker" "Docker" "https://docs.docker.com/get-docker/"

# Check Docker is running
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker is not running${NC}"
    ((ERRORS++))
fi

echo ""

# Check AWS credentials
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}2. Validating AWS Credentials${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if aws sts get-caller-identity &> /dev/null; then
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
    echo -e "${GREEN}✅ AWS credentials are valid${NC}"
    echo -e "   Account ID: ${AWS_ACCOUNT_ID}"
    echo -e "   User/Role: ${AWS_USER}"
else
    echo -e "${RED}❌ AWS credentials are not configured or invalid${NC}"
    echo -e "   Run: aws configure"
    ((ERRORS++))
fi

echo ""

# Check Terraform configuration
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}3. Checking Terraform Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

cd "$(dirname "$0")/.."

# Check if terraform.tfvars exists for environment
if [ -f "environments/${ENVIRONMENT}/terraform.tfvars" ]; then
    echo -e "${GREEN}✅ Environment configuration exists: environments/${ENVIRONMENT}/terraform.tfvars${NC}"
else
    echo -e "${RED}❌ Environment configuration not found: environments/${ENVIRONMENT}/terraform.tfvars${NC}"
    ((ERRORS++))
fi

# Check if Terraform is initialized
if [ -d ".terraform" ]; then
    echo -e "${GREEN}✅ Terraform is initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Terraform not initialized${NC}"
    echo -e "   Run: terraform init"
    ((WARNINGS++))
fi

# Validate Terraform syntax
if terraform validate -json &> /dev/null; then
    echo -e "${GREEN}✅ Terraform configuration is valid${NC}"
else
    echo -e "${RED}❌ Terraform configuration has errors${NC}"
    terraform validate
    ((ERRORS++))
fi

echo ""

# Check required variables
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}4. Validating Required Variables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -f "environments/${ENVIRONMENT}/terraform.tfvars" ]; then
    # Check for required variables
    REQUIRED_VARS=(
        "aws_region"
        "environment"
        "api_image"
        "worker_image"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}\s*=" "environments/${ENVIRONMENT}/terraform.tfvars"; then
            echo -e "${GREEN}✅ ${var} is configured${NC}"
        else
            echo -e "${RED}❌ ${var} is not configured${NC}"
            ((ERRORS++))
        fi
    done

    # Check for optional but important variables
    OPTIONAL_VARS=(
        "gemini_api_key"
        "smtp_host"
        "alert_email"
    )

    for var in "${OPTIONAL_VARS[@]}"; do
        if grep -q "^${var}\s*=" "environments/${ENVIRONMENT}/terraform.tfvars"; then
            echo -e "${GREEN}✅ ${var} is configured${NC}"
        else
            echo -e "${YELLOW}⚠️  ${var} is not configured (optional)${NC}"
            ((WARNINGS++))
        fi
    done
fi

echo ""

# Check Docker images
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}5. Checking Docker Images${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if Dockerfiles exist
if [ -f "../../packages/api/Dockerfile" ]; then
    echo -e "${GREEN}✅ API Dockerfile exists${NC}"
else
    echo -e "${RED}❌ API Dockerfile not found${NC}"
    ((ERRORS++))
fi

if [ -f "../../packages/worker/Dockerfile" ]; then
    echo -e "${GREEN}✅ Worker Dockerfile exists${NC}"
else
    echo -e "${RED}❌ Worker Dockerfile not found${NC}"
    ((ERRORS++))
fi

# Check if images are built or available in ECR
if [ -f "environments/${ENVIRONMENT}/terraform.tfvars" ]; then
    API_IMAGE=$(grep "^api_image" "environments/${ENVIRONMENT}/terraform.tfvars" | cut -d'"' -f2)
    WORKER_IMAGE=$(grep "^worker_image" "environments/${ENVIRONMENT}/terraform.tfvars" | cut -d'"' -f2)

    if [[ $API_IMAGE == *"ecr"* ]]; then
        echo -e "${YELLOW}⚠️  Using ECR images - ensure they are pushed${NC}"
        echo -e "   API: ${API_IMAGE}"
        echo -e "   Worker: ${WORKER_IMAGE}"
        echo -e "   Run: ./scripts/push-to-ecr.sh ${ENVIRONMENT}"
        ((WARNINGS++))
    else
        echo -e "${YELLOW}⚠️  Using Docker Hub images${NC}"
        ((WARNINGS++))
    fi
fi

echo ""

# Check cost estimation
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}6. Estimated Monthly Costs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

case $ENVIRONMENT in
    dev)
        echo -e "   ECS Fargate:    ~$30-50"
        echo -e "   RDS (t4g.micro):  ~$15-20"
        echo -e "   ElastiCache:    ~$15-20"
        echo -e "   ALB:            ~$20-25"
        echo -e "   S3 + CloudFront: ~$5-10"
        echo -e "   Other:          ~$10-15"
        echo -e "   ${CYAN}━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "   ${YELLOW}Total: ~$95-140/month${NC}"
        ;;
    staging)
        echo -e "   ECS Fargate:    ~$100-150"
        echo -e "   RDS (t4g.small): ~$30-40"
        echo -e "   ElastiCache:    ~$30-40"
        echo -e "   ALB:            ~$25-30"
        echo -e "   S3 + CloudFront: ~$10-20"
        echo -e "   Other:          ~$20-30"
        echo -e "   ${CYAN}━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "   ${YELLOW}Total: ~$215-310/month${NC}"
        ;;
    prod)
        echo -e "   ECS Fargate:    ~$500-800"
        echo -e "   RDS (Multi-AZ):  ~$300-500"
        echo -e "   ElastiCache:    ~$150-200"
        echo -e "   ALB:            ~$40-50"
        echo -e "   S3 + CloudFront: ~$50-100"
        echo -e "   Other:          ~$100-150"
        echo -e "   ${CYAN}━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "   ${YELLOW}Total: ~$1,140-1,800/month${NC}"
        ;;
esac

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}7. Validation Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "${GREEN}✅ Ready to deploy${NC}\n"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) found${NC}"
    echo -e "${GREEN}✅ Can proceed with deployment${NC}\n"
    echo -e "${CYAN}Recommended next steps:${NC}"
    echo "   1. terraform init (if not done)"
    echo "   2. terraform plan -var-file=\"environments/${ENVIRONMENT}/terraform.tfvars\""
    echo "   3. terraform apply -var-file=\"environments/${ENVIRONMENT}/terraform.tfvars\""
    echo ""
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} error(s) found${NC}"
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) found${NC}"
    echo -e "${RED}❌ Cannot proceed with deployment${NC}\n"
    echo -e "${CYAN}Fix the errors above and run again${NC}\n"
    exit 1
fi
