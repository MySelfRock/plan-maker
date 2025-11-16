-- Database initialization script
-- Creates extensions and basic setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for better text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for common JSON queries (will be added after tables are created via Prisma)
