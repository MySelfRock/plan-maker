import { z } from 'zod';

/**
 * User and Authentication Types
 */

export enum UserRole {
  USER = 'user',
  COACH = 'coach',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin', // for multi-tenant management
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}

export interface User {
  id: string;
  tenantId: string; // Multi-tenant: which brand this user belongs to
  email: string;
  passwordHash?: string; // null for OAuth-only users
  name: string;
  role: UserRole;
  authProvider: AuthProvider;
  emailVerified: boolean;
  locale: string; // e.g., 'pt-BR', 'en-US'
  timezone: string; // e.g., 'America/Sao_Paulo'
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// Zod schemas
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  locale: z.string().default('pt-BR'),
  timezone: z.string().default('America/Sao_Paulo'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
