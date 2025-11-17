#!/bin/bash
set -e

# PlanMaker SaaS - Deployment Script
ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

echo "🚀 PlanMaker SaaS Deployment"
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "❌ Error: Invalid environment"
    exit 1
fi

cd "$(dirname "$0")/.."

terraform init
terraform workspace select "$ENVIRONMENT" || terraform workspace new "$ENVIRONMENT"

VAR_FILE="environments/${ENVIRONMENT}/terraform.tfvars"

case "$ACTION" in
    plan) terraform plan -var-file="$VAR_FILE" ;;
    apply) terraform apply -var-file="$VAR_FILE" ;;
    destroy) terraform destroy -var-file="$VAR_FILE" ;;
    *) echo "Invalid action"; exit 1 ;;
esac
