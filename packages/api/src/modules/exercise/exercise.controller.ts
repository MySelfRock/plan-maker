import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('exercises')
@Controller('exercises')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  @Get()
  async findAll(@CurrentUser() user: User, @Query() query: any) {
    const { skip, take, niche, level, tags, ...filters } = query;
    const pagination = {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    };
    return this.exerciseService.findAll(user.tenantId, { niche, level, tags }, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.exerciseService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async create(@CurrentUser() user: User, @Body() body: any) {
    return this.exerciseService.create(user.tenantId, body);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.exerciseService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    await this.exerciseService.delete(id);
    return { message: 'Exercise deleted' };
  }
}
