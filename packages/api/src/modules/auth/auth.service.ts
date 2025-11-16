import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { User } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register new user
   */
  async register(data: {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    locale?: string;
    timezone?: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    // Check if user already exists in this tenant
    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: data.tenantId,
          email: data.email,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const passwordHash = await argon2.hash(data.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...data,
        passwordHash,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Login user
   */
  async login(
    tenantId: string,
    email: string,
    password: string,
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if refresh token exists in DB
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if expired
      if (tokenRecord.expiresAt < new Date()) {
        // Delete expired token
        await this.prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        throw new UnauthorizedException('Refresh token expired');
      }

      // Generate new tokens
      return this.generateTokens(tokenRecord.user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Logout from all devices
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    // Access token (short-lived)
    const accessToken = this.jwtService.sign(payload);

    // Refresh token (long-lived)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Store refresh token in DB
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + expiresIn),
      },
    });

    // Clean up old refresh tokens (keep only last 5)
    const oldTokens = await this.prisma.refreshToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: 5,
    });

    if (oldTokens.length > 0) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          id: { in: oldTokens.map((t) => t.id) },
        },
      });
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * OAuth login/register
   */
  async oauthLogin(data: {
    tenantId: string;
    email: string;
    name: string;
    provider: string;
    providerId?: string;
    avatarUrl?: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens; isNewUser: boolean }> {
    let user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: data.tenantId,
          email: data.email,
        },
      },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          tenantId: data.tenantId,
          email: data.email,
          name: data.name,
          authProvider: data.provider,
          emailVerified: true, // OAuth users are auto-verified
          avatarUrl: data.avatarUrl,
        },
      });
      isNewUser = true;
    } else {
      // Update last login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    const tokens = await this.generateTokens(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens, isNewUser };
  }
}
