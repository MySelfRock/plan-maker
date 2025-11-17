#!/bin/bash

# =========================================
# Push Docker Images to AWS ECR
# =========================================
# This script builds and pushes Docker images
# to AWS ECR for deployment with Terraform
# =========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=""
VERSION="${VERSION:-v1.0.0}"
LATEST_TAG="latest"

# Parse command line arguments
ENVIRONMENT="${1:-dev}"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Push Docker Images to AWS ECR                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}\n"

# Get AWS Account ID
echo -e "${CYAN}🔍 Getting AWS Account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Failed to get AWS Account ID. Check your AWS credentials.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}\n"

# Define ECR repositories
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
API_REPO="${ECR_REGISTRY}/planmaker-api"
WORKER_REPO="${ECR_REGISTRY}/planmaker-worker"

# Login to ECR
echo -e "${CYAN}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
echo -e "${GREEN}✅ Logged in to ECR${NC}\n"

# Create ECR repositories if they don't exist
echo -e "${CYAN}📦 Creating ECR repositories (if needed)...${NC}"

for repo in "planmaker-api" "planmaker-worker"; do
    if ! aws ecr describe-repositories --repository-names ${repo} --region ${AWS_REGION} &> /dev/null; then
        echo "Creating repository: ${repo}"
        aws ecr create-repository \
            --repository-name ${repo} \
            --region ${AWS_REGION} \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            --tags Key=Environment,Value=${ENVIRONMENT} Key=ManagedBy,Value=Terraform
        echo -e "${GREEN}✅ Created ${repo}${NC}"
    else
        echo -e "${GREEN}✅ Repository ${repo} already exists${NC}"
    fi
done
echo ""

# Build and push API image
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🏗️  Building API Docker image...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

cd ../../..
docker build -f packages/api/Dockerfile -t planmaker-api:${VERSION} .
echo -e "${GREEN}✅ API image built${NC}\n"

# Tag and push API image
echo -e "${CYAN}📤 Pushing API image to ECR...${NC}"
docker tag planmaker-api:${VERSION} ${API_REPO}:${VERSION}
docker tag planmaker-api:${VERSION} ${API_REPO}:${LATEST_TAG}
docker push ${API_REPO}:${VERSION}
docker push ${API_REPO}:${LATEST_TAG}
echo -e "${GREEN}✅ API image pushed: ${API_REPO}:${VERSION}${NC}\n"

# Build and push Worker image
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🏗️  Building Worker Docker image...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

docker build -f packages/worker/Dockerfile -t planmaker-worker:${VERSION} .
echo -e "${GREEN}✅ Worker image built${NC}\n"

# Tag and push Worker image
echo -e "${CYAN}📤 Pushing Worker image to ECR...${NC}"
docker tag planmaker-worker:${VERSION} ${WORKER_REPO}:${VERSION}
docker tag planmaker-worker:${VERSION} ${WORKER_REPO}:${LATEST_TAG}
docker push ${WORKER_REPO}:${VERSION}
docker push ${WORKER_REPO}:${LATEST_TAG}
echo -e "${GREEN}✅ Worker image pushed: ${WORKER_REPO}:${VERSION}${NC}\n"

# Summary
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Images Pushed Successfully! ✅             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${CYAN}📦 Pushed Images:${NC}"
echo "   • API:    ${API_REPO}:${VERSION}"
echo "   • API:    ${API_REPO}:${LATEST_TAG}"
echo "   • Worker: ${WORKER_REPO}:${VERSION}"
echo "   • Worker: ${WORKER_REPO}:${LATEST_TAG}"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Update Terraform variables with image URIs:"
echo "      api_image    = \"${API_REPO}:${VERSION}\""
echo "      worker_image = \"${WORKER_REPO}:${VERSION}\""
echo ""
echo "   2. Deploy infrastructure:"
echo "      cd infrastructure/terraform"
echo "      terraform apply -var-file=\"environments/${ENVIRONMENT}/terraform.tfvars\""
echo ""

echo -e "${GREEN}✅ Done!${NC}\n"
