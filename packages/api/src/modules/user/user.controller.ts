import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() body: any) {
    return this.userService.update(user.id, body);
  }

  @Delete('me')
  async deleteMe(@CurrentUser() user: User) {
    await this.userService.delete(user.id);
    return { message: 'Account deleted successfully' };
  }
}
