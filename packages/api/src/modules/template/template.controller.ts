import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplateController {
  constructor(private templateService: TemplateService) {}

  @Get()
  async findAll(@CurrentUser() user: User, @Query() query: any) {
    const pagination = {
      skip: query.skip ? parseInt(query.skip) : undefined,
      take: query.take ? parseInt(query.take) : undefined,
    };
    return this.templateService.findAll(user.tenantId, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async create(@CurrentUser() user: User, @Body() body: any) {
    return this.templateService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.templateService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    await this.templateService.delete(id);
    return { message: 'Template deleted' };
  }
}
