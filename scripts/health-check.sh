#!/bin/bash

# PlanMaker SaaS - Health Check Script
# Verifies all services are running correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}==> ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${1}"
}

print_error() {
    echo -e "${RED}✗${NC} ${1}"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} ${1}"
}

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════╗"
echo "║   PlanMaker SaaS - Health Check              ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

ERRORS=0

# Check Docker containers
print_header "Checking Docker Containers"

if docker ps | grep -q "planmaker-postgres"; then
    print_success "PostgreSQL container is running"
else
    print_error "PostgreSQL container is not running"
    ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q "planmaker-redis"; then
    print_success "Redis container is running"
else
    print_error "Redis container is not running"
    ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q "planmaker-minio"; then
    print_success "MinIO container is running"
else
    print_error "MinIO container is not running"
    ERRORS=$((ERRORS + 1))
fi

# Check database connection
print_header "Checking Database Connection"

if docker exec planmaker-postgres psql -U planmaker -d planmaker -c "SELECT 1" > /dev/null 2>&1; then
    print_success "PostgreSQL is accepting connections"

    # Check if tables exist
    TABLE_COUNT=$(docker exec planmaker-postgres psql -U planmaker -d planmaker -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

    if [ "$TABLE_COUNT" -gt 0 ]; then
        print_success "Database has $TABLE_COUNT tables"
    else
        print_warning "Database has no tables - run migrations: yarn migrate:dev"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "Cannot connect to PostgreSQL"
    ERRORS=$((ERRORS + 1))
fi

# Check Redis connection
print_header "Checking Redis Connection"

if docker exec planmaker-redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is responding to PING"

    # Check Redis memory usage
    REDIS_MEMORY=$(docker exec planmaker-redis redis-cli INFO memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    print_success "Redis memory usage: $REDIS_MEMORY"
else
    print_error "Cannot connect to Redis"
    ERRORS=$((ERRORS + 1))
fi

# Check MinIO
print_header "Checking MinIO (S3)"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/live | grep -q "200"; then
    print_success "MinIO is healthy"
else
    print_warning "MinIO health check failed"
fi

# Check MinIO buckets
if docker exec planmaker-minio mc alias set local http://localhost:9000 minioadmin minioadmin > /dev/null 2>&1; then
    BUCKETS=$(docker exec planmaker-minio mc ls local 2>/dev/null | wc -l | xargs)

    if [ "$BUCKETS" -ge 2 ]; then
        print_success "MinIO has $BUCKETS buckets configured"
    else
        print_warning "MinIO buckets not created - they will be auto-created on first upload"
    fi
else
    print_warning "Cannot check MinIO buckets"
fi

# Check API (if running)
print_header "Checking API Server (if running)"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health | grep -q "200"; then
    print_success "API is responding on http://localhost:3000"

    # Check Swagger docs
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/docs | grep -q "200"; then
        print_success "Swagger docs available at http://localhost:3000/api/docs"
    fi
else
    print_warning "API is not running - start it with: yarn dev:api"
fi

# Check Frontend (if running)
print_header "Checking Frontend Server (if running)"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|301\|302"; then
    print_success "Frontend is responding on http://localhost:3001"
else
    print_warning "Frontend is not running - start it with: yarn dev:frontend"
fi

# Check environment files
print_header "Checking Environment Files"

for package in api frontend worker; do
    ENV_FILE="packages/${package}/.env"

    if [ -f "$ENV_FILE" ]; then
        print_success "$ENV_FILE exists"

        # Check for placeholder values
        if grep -q "your-gemini-api-key-here" "$ENV_FILE" 2>/dev/null; then
            print_warning "$package: Gemini API key needs to be configured"
        fi

        if grep -q "your_key_here\|your_secret_here" "$ENV_FILE" 2>/dev/null; then
            print_warning "$package: Some API keys need to be configured"
        fi
    else
        print_error "$ENV_FILE not found"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check Node.js version
print_header "Checking Node.js Version"

NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    print_success "Node.js version $NODE_VERSION (>= $REQUIRED_VERSION)"
else
    print_error "Node.js version $NODE_VERSION is too old (need >= $REQUIRED_VERSION)"
    ERRORS=$((ERRORS + 1))
fi

# Check disk space
print_header "Checking Disk Space"

AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
print_success "Available disk space: $AVAILABLE_SPACE"

# Summary
echo ""
echo "╔═══════════════════════════════════════════════╗"

if [ $ERRORS -eq 0 ]; then
    echo -e "║ ${GREEN}  ✓ All checks passed!${NC}                      ║"
else
    echo -e "║ ${RED}  ✗ Found $ERRORS error(s)${NC}                        ║"
fi

echo "╚═══════════════════════════════════════════════╝"
echo ""

# Quick start reminder
if [ $ERRORS -eq 0 ]; then
    echo -e "${BLUE}🚀 Quick Start:${NC}"
    echo ""
    echo -e "  Start all services:  ${GREEN}yarn dev${NC}"
    echo -e "  Start API only:      ${GREEN}yarn dev:api${NC}"
    echo -e "  Start frontend only: ${GREEN}yarn dev:frontend${NC}"
    echo -e "  Start worker only:   ${GREEN}yarn dev:worker${NC}"
    echo ""
    echo -e "${BLUE}📊 Useful URLs:${NC}"
    echo ""
    echo "  Frontend:      http://localhost:3001"
    echo "  API Docs:      http://localhost:3000/api/docs"
    echo "  MinIO Console: http://localhost:9001"
    echo "  Prisma Studio: yarn workspace @planmaker/api prisma:studio"
    echo ""
else
    echo -e "${YELLOW}⚠️  Please fix the errors above before starting development${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Start Docker services: yarn docker:up"
    echo "  - Run migrations: yarn migrate:dev"
    echo "  - Seed database: yarn workspace @planmaker/api prisma:seed"
    echo "  - Setup .env files: cp packages/*/.env.example packages/*/.env"
    echo ""
fi

exit $ERRORS
