import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TenantService } from '../tenant/tenant.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Request } from 'express';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tenantService: TenantService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Req() req: Request, @Body() body: RegisterDto) {
    const hostname = req.get('host') || 'localhost';
    const tenant = await this.tenantService.resolveTenantFromHost(hostname);

    return this.authService.register({
      tenantId: tenant.id,
      ...body,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  async login(@Req() req: Request, @Body() body: LoginDto) {
    const hostname = req.get('host') || 'localhost';
    const tenant = await this.tenantService.resolveTenantFromHost(hostname);

    return this.authService.login(tenant.id, body.email, body.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@CurrentUser() user: User, @Body() body?: LogoutDto) {
    await this.authService.logout(user.id, body?.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: User) {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // OAuth endpoints
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request & { user: User }) {
    return req.user; // User is attached by GoogleStrategy
  }
}
