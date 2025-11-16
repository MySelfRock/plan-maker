import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { TemplateVersioningService } from './template-versioning.service';
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
  constructor(
    private templateService: TemplateService,
    private versioningService: TemplateVersioningService,
  ) {}

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

  // Version Management Endpoints
  @Post(':id/versions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  @ApiOperation({ summary: 'Create a new version of template' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  async createVersion(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { changes: string },
  ) {
    return this.versioningService.createVersion(id, user.id, body.changes);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a template' })
  @ApiResponse({ status: 200, description: 'Version history retrieved successfully' })
  async getVersions(@Param('id') id: string) {
    return this.versioningService.getVersions(id);
  }

  @Get(':id/versions/current')
  @ApiOperation({ summary: 'Get current version number' })
  @ApiResponse({ status: 200, description: 'Current version retrieved successfully' })
  async getCurrentVersion(@Param('id') id: string) {
    const version = await this.versioningService.getCurrentVersion(id);
    return { currentVersion: version };
  }

  @Get(':id/versions/compare')
  @ApiOperation({ summary: 'Compare two versions' })
  @ApiResponse({ status: 200, description: 'Version comparison completed successfully' })
  async compareVersions(
    @Param('id') id: string,
    @Query('version1') version1: string,
    @Query('version2') version2: string,
  ) {
    return this.versioningService.compareVersions(
      id,
      parseInt(version1),
      parseInt(version2),
    );
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get a specific version' })
  @ApiResponse({ status: 200, description: 'Version retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async getVersion(@Param('id') id: string, @Param('version') version: string) {
    return this.versioningService.getVersion(id, parseInt(version));
  }

  @Post(':id/versions/:version/restore')
  @UseGuards(RolesGuard)
  @Roles('admin', 'coach')
  @ApiOperation({ summary: 'Restore template to a specific version' })
  @ApiResponse({ status: 200, description: 'Template restored successfully' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('version') version: string,
    @CurrentUser() user: User,
  ) {
    await this.versioningService.restoreVersion(id, parseInt(version), user.id);
    return { message: 'Template restored successfully' };
  }
}
