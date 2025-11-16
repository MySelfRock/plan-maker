import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('profiles')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User) {
    return this.profileService.findByUserId(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create profile (onboarding)' })
  async createProfile(@CurrentUser() user: User, @Body() body: any) {
    return this.profileService.upsert(user.id, user.tenantId, body);
  }

  @Put()
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(@CurrentUser() user: User, @Body() body: any) {
    return this.profileService.upsert(user.id, user.tenantId, body);
  }
}
