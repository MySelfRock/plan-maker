#!/bin/bash

# PlanMaker SaaS - Automated Setup Script
# This script sets up the entire development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "\n${BLUE}==>${NC} ${1}"
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

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║                                               ║
║   PlanMaker SaaS - Development Setup          ║
║   White-label Activity Planning Platform      ║
║                                               ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Step 1: Check prerequisites
print_step "Step 1/8: Checking prerequisites..."

MISSING_DEPS=0

if ! check_command "node"; then
    print_error "Please install Node.js >= 18.0.0 from https://nodejs.org/"
    MISSING_DEPS=1
else
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
fi

if ! check_command "yarn"; then
    print_error "Please install Yarn: npm install -g yarn"
    MISSING_DEPS=1
else
    YARN_VERSION=$(yarn --version)
    print_success "Yarn version: $YARN_VERSION"
fi

if ! check_command "docker"; then
    print_error "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    MISSING_DEPS=1
else
    DOCKER_VERSION=$(docker --version)
    print_success "Docker version: $DOCKER_VERSION"
fi

if ! check_command "docker-compose"; then
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        MISSING_DEPS=1
    else
        print_success "Docker Compose is available (using 'docker compose')"
    fi
else
    print_success "Docker Compose is available"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies and run this script again"
    exit 1
fi

# Step 2: Install dependencies
print_step "Step 2/8: Installing dependencies..."
print_warning "This may take 2-3 minutes..."

if yarn install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Start Docker services
print_step "Step 3/8: Starting Docker services..."

if docker-compose up -d; then
    print_success "Docker services started"

    # Wait for services to be ready
    print_warning "Waiting for services to be ready (10 seconds)..."
    sleep 10

    # Check if containers are running
    if docker ps | grep -q "planmaker-postgres"; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL failed to start"
        exit 1
    fi

    if docker ps | grep -q "planmaker-redis"; then
        print_success "Redis is running"
    else
        print_error "Redis failed to start"
        exit 1
    fi

    if docker ps | grep -q "planmaker-minio"; then
        print_success "MinIO is running"
    else
        print_error "MinIO failed to start"
        exit 1
    fi
else
    print_error "Failed to start Docker services"
    exit 1
fi

# Step 4: Setup environment files
print_step "Step 4/8: Setting up environment files..."

for package in api frontend worker; do
    ENV_FILE="packages/${package}/.env"
    ENV_EXAMPLE="packages/${package}/.env.example"

    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            print_success "Created $ENV_FILE from example"
        else
            print_warning "No .env.example found for $package"
        fi
    else
        print_success "$ENV_FILE already exists"
    fi
done

# Check if Gemini API key is configured
if grep -q "your-gemini-api-key-here" packages/api/.env; then
    print_warning "⚠️  IMPORTANT: You need to add your Gemini API key!"
    echo ""
    echo "1. Get your API key from: https://makersuite.google.com/app/apikey"
    echo "2. Edit packages/api/.env"
    echo "3. Replace 'your-gemini-api-key-here' with your actual key"
    echo ""
    read -p "Press Enter to continue after updating the API key, or Ctrl+C to exit..."
fi

# Step 5: Generate Prisma client
print_step "Step 5/8: Generating Prisma client..."

if cd packages/api && npx prisma generate && cd ../..; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Step 6: Run database migrations
print_step "Step 6/8: Running database migrations..."

if yarn migrate:dev; then
    print_success "Database migrations completed"
else
    print_error "Failed to run migrations"
    print_warning "Trying to reset database..."

    if cd packages/api && npx prisma migrate reset --force && cd ../..; then
        print_success "Database reset and migrations completed"
    else
        print_error "Failed to reset database"
        exit 1
    fi
fi

# Step 7: Seed database
print_step "Step 7/8: Seeding database with demo data..."

if yarn workspace @planmaker/api prisma:seed; then
    print_success "Database seeded successfully"
else
    print_error "Failed to seed database"
    exit 1
fi

# Step 8: Final verification
print_step "Step 8/8: Verifying setup..."

# Check database connection
if docker exec planmaker-postgres psql -U planmaker -d planmaker -c "SELECT 1" > /dev/null 2>&1; then
    print_success "Database connection verified"
else
    print_error "Database connection failed"
    exit 1
fi

# Check Redis connection
if docker exec planmaker-redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis connection verified"
else
    print_error "Redis connection failed"
    exit 1
fi

# Success banner
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║                                               ║
║   ✓ Setup completed successfully!            ║
║                                               ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Next steps
echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Start all services:"
echo -e "   ${GREEN}yarn dev${NC}"
echo ""
echo "2. Or start services individually:"
echo -e "   ${GREEN}yarn dev:api${NC}       # API on http://localhost:3000"
echo -e "   ${GREEN}yarn dev:frontend${NC}  # Frontend on http://localhost:3001"
echo -e "   ${GREEN}yarn dev:worker${NC}    # Worker process"
echo ""
echo "3. Access the application:"
echo -e "   ${BLUE}Frontend:${NC}     http://localhost:3001"
echo -e "   ${BLUE}API Docs:${NC}     http://localhost:3000/api/docs"
echo -e "   ${BLUE}MinIO Console:${NC} http://localhost:9001"
echo ""
echo "4. Test credentials:"
echo -e "   ${YELLOW}Admin:${NC} admin@demo.com / admin123"
echo -e "   ${YELLOW}User:${NC}  test@demo.com / test123"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - DEVELOPMENT.md  - Complete development guide"
echo "   - README.md       - Project overview"
echo "   - IMPLEMENTATION.md - Technical implementation details"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
echo ""
