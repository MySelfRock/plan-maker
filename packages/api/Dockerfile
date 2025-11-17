# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared

# Generate Prisma Client
WORKDIR /app/packages/api
RUN yarn prisma:generate

# Build the application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

# Copy built application from builder
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/prisma ./packages/api/prisma
COPY --from=builder /app/packages/api/node_modules/.prisma ./packages/api/node_modules/.prisma
COPY --from=builder /app/packages/shared ./packages/shared

WORKDIR /app/packages/api

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]
