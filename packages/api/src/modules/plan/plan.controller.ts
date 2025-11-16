import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PlanService } from './plan.service';
import { PlanGenerationService } from './plan-generation.service';
import { PlanExportService } from './plan-export.service';
import { PlanAnalyticsService } from './plan-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { UpdatePlanStatusDto } from './dto/update-plan-status.dto';

@ApiTags('plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanController {
  constructor(
    private planService: PlanService,
    private planGenerationService: PlanGenerationService,
    private planExportService: PlanExportService,
    private planAnalyticsService: PlanAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all user plans' })
  async getUserPlans(@CurrentUser() user: User, @Query() query: PaginationDto) {
    return this.planService.findUserPlans(user.id, false, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  async getPlan(@Param('id') id: string, @CurrentUser() user: User) {
    const plan = await this.planService.findById(id);

    // Check if user owns this plan
    if (plan.userId !== user.id) {
      throw new UnauthorizedException('You do not have permission to access this plan');
    }

    return plan;
  }

  @Post('generate')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for expensive AI operations
  @ApiOperation({ summary: 'Generate new plan (async)' })
  async generatePlan(@CurrentUser() user: User, @Body() body: CreatePlanDto) {
    // Queue the plan generation job
    return this.planService.requestPlanGeneration({
      userId: user.id,
      tenantId: user.tenantId,
      profileId: body.profileId,
      planType: body.planType || 'weekly',
      startDate: new Date(body.startDate || Date.now()),
      weeks: body.weeks,
      templateId: body.templateId,
    });
  }

  @Post('generate-sync')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Even stricter for sync AI operations (3/min)
  @ApiOperation({ summary: 'Generate new plan (synchronous, for testing)' })
  async generatePlanSync(@CurrentUser() user: User, @Body() body: CreatePlanDto) {
    // Direct generation (use with caution, can be slow)
    return this.planGenerationService.generatePlan({
      userId: user.id,
      tenantId: user.tenantId,
      profileId: body.profileId,
      planType: body.planType || 'weekly',
      startDate: new Date(body.startDate || Date.now()),
      weeks: body.weeks,
      templateId: body.templateId,
    });
  }

  @Patch(':planId/sessions/:sessionId/complete')
  @ApiOperation({ summary: 'Mark session as completed with feedback' })
  async completeSession(
    @Param('planId') planId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: CompleteSessionDto,
  ) {
    await this.planService.completeSession(sessionId, body);
    return { message: 'Session completed successfully' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update plan status' })
  async updatePlanStatus(@Param('id') id: string, @Body() body: UpdatePlanStatusDto) {
    return this.planService.updatePlanStatus(id, body.status);
  }

  // Export endpoints
  @Get(':id/export/json')
  @ApiOperation({ summary: 'Export plan as JSON' })
  @ApiResponse({ status: 200, description: 'Plan exported successfully' })
  async exportPlanJSON(@Param('id') id: string, @CurrentUser() user: User) {
    const plan = await this.planService.findById(id, false);
    if (plan.userId !== user.id) {
      throw new UnauthorizedException('You do not have permission to export this plan');
    }
    return this.planExportService.exportAsJSON(id);
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export plan as PDF-ready data' })
  @ApiResponse({ status: 200, description: 'PDF data generated successfully' })
  async exportPlanPDF(@Param('id') id: string, @CurrentUser() user: User) {
    const plan = await this.planService.findById(id, false);
    if (plan.userId !== user.id) {
      throw new UnauthorizedException('You do not have permission to export this plan');
    }
    return this.planExportService.exportAsPDFData(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get plan summary with progress' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getPlanSummary(@Param('id') id: string, @CurrentUser() user: User) {
    const plan = await this.planService.findById(id, false);
    if (plan.userId !== user.id) {
      throw new UnauthorizedException('You do not have permission to access this plan');
    }
    return this.planExportService.exportSummary(id);
  }

  // Analytics endpoints
  @Get('analytics/me')
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getMyStats(@CurrentUser() user: User) {
    return this.planAnalyticsService.getUserStats(user.id);
  }

  @Get('analytics/popular-exercises')
  @ApiOperation({ summary: 'Get popular exercises' })
  @ApiResponse({ status: 200, description: 'Popular exercises retrieved successfully' })
  async getPopularExercises(@CurrentUser() user: User, @Query('limit') limit?: string) {
    return this.planAnalyticsService.getPopularExercises(
      user.tenantId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('analytics/trends')
  @ApiOperation({ summary: 'Get plan generation trends' })
  @ApiResponse({ status: 200, description: 'Trends retrieved successfully' })
  async getPlanTrends(@CurrentUser() user: User, @Query('days') days?: string) {
    return this.planAnalyticsService.getPlanGenerationTrends(
      user.tenantId,
      days ? parseInt(days) : 30,
    );
  }
}
