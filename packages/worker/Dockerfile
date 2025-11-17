# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY packages/worker ./packages/worker
COPY packages/shared ./packages/shared

# Build the application
WORKDIR /app/packages/worker
RUN yarn build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

# Copy built application from builder
COPY --from=builder /app/packages/worker/dist ./packages/worker/dist
COPY --from=builder /app/packages/shared ./packages/shared

# Copy email templates
COPY packages/worker/templates ./packages/worker/templates

WORKDIR /app/packages/worker

# Start the application
CMD ["node", "dist/main.js"]
