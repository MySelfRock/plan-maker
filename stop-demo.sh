#!/bin/bash

# =========================================
# PlanMaker SaaS - Stop Demo Script
# =========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}🛑 Stopping PlanMaker Demo Environment...${NC}\n"

# Stop all containers
docker-compose -f docker-compose.demo.yml down

echo -e "\n${GREEN}✅ Demo environment stopped successfully!${NC}"

# Ask if user wants to remove volumes (data)
echo -e "\n${YELLOW}Do you want to remove all demo data? (y/N)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${CYAN}🗑️  Removing demo volumes...${NC}"
    docker-compose -f docker-compose.demo.yml down -v
    echo -e "${GREEN}✅ Demo data removed${NC}\n"
else
    echo -e "\n${CYAN}ℹ️  Demo data preserved. Use the same command to restart with existing data.${NC}\n"
fi
