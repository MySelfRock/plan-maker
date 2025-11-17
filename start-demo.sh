#!/bin/bash

# =========================================
# PlanMaker SaaS - Demo Startup Script
# =========================================
# This script starts a complete demo environment
# for presentations and sales demonstrations
# =========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🚀 PlanMaker SaaS - DEMO MODE 🚀              ║"
echo "║                                                            ║"
echo "║         White-label Activity Planning Platform            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check if Docker is running
echo -e "${CYAN}📋 Checking prerequisites...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}\n"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install it and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose is available${NC}\n"

# Stop any existing demo containers
echo -e "${YELLOW}🛑 Stopping any existing demo containers...${NC}"
docker-compose -f docker-compose.demo.yml down > /dev/null 2>&1 || true
echo -e "${GREEN}✅ Cleanup complete${NC}\n"

# Start the demo environment
echo -e "${CYAN}🚀 Starting demo environment...${NC}"
echo -e "${YELLOW}   This may take a few minutes on first run (downloading images)${NC}\n"

docker-compose -f docker-compose.demo.yml up -d

# Wait for services to be healthy
echo -e "\n${CYAN}⏳ Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -n "   PostgreSQL: "
for i in {1..30}; do
    if docker-compose -f docker-compose.demo.yml exec -T postgres pg_isready -U demo > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Redis
echo -n "   Redis: "
for i in {1..30}; do
    if docker-compose -f docker-compose.demo.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for MinIO
echo -n "   MinIO: "
for i in {1..30}; do
    if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for API
echo -n "   API: "
for i in {1..60}; do
    if curl -f http://localhost:3000/api/v1/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

echo ""

# Display access information
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              ✅ DEMO ENVIRONMENT IS READY! ✅              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${BLUE}📡 API Endpoints:${NC}"
echo "   • REST API:     http://localhost:3000/api/v1"
echo "   • Swagger Docs: http://localhost:3000/api/docs"
echo "   • Health Check: http://localhost:3000/api/v1/health"
echo ""

echo -e "${PURPLE}🎨 MinIO Console:${NC}"
echo "   • URL:      http://localhost:9001"
echo "   • Username: demo"
echo "   • Password: demo123demo"
echo ""

echo -e "${CYAN}👥 Demo Credentials:${NC}"
echo ""
echo -e "${YELLOW}🏋️  FitPro Academy (Tenant: fitpro-demo)${NC}"
echo "   • Admin:  admin@fitpro-demo.com / Admin123!"
echo "   • Coach:  coach@fitpro-demo.com / Coach123!"
echo "   • User:   user@fitpro-demo.com / User123!"
echo ""
echo -e "${YELLOW}🎸  MusicMaster School (Tenant: musicmaster-demo)${NC}"
echo "   • Admin:  admin@musicmaster-demo.com / Admin123!"
echo "   • Coach:  coach@musicmaster-demo.com / Coach123!"
echo "   • User:   user@musicmaster-demo.com / User123!"
echo ""

echo -e "${GREEN}📝 Quick Start Guide:${NC}"
echo "   1. Open Swagger Docs: http://localhost:3000/api/docs"
echo "   2. Click 'Authorize' button"
echo "   3. Use POST /auth/login with demo credentials"
echo "   4. Copy the access token from response"
echo "   5. Paste token in authorization dialog"
echo "   6. Explore the API endpoints!"
echo ""

echo -e "${YELLOW}🔍 View Logs:${NC}"
echo "   • All services:  docker-compose -f docker-compose.demo.yml logs -f"
echo "   • API only:      docker-compose -f docker-compose.demo.yml logs -f api"
echo "   • Worker only:   docker-compose -f docker-compose.demo.yml logs -f worker"
echo ""

echo -e "${RED}🛑 Stop Demo:${NC}"
echo "   docker-compose -f docker-compose.demo.yml down"
echo ""

echo -e "${BLUE}💡 Tips:${NC}"
echo "   • The demo includes 2 multi-tenant organizations"
echo "   • Each tenant has pre-loaded templates, exercises, and sample data"
echo "   • AI features require a valid GOOGLE_AI_API_KEY in .env.demo"
echo "   • Email notifications are logged to console (no real emails sent)"
echo ""

echo -e "${GREEN}🎉 Ready for your demo presentation! 🎉${NC}\n"
