import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { PlanGenerationService } from './plan-generation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanController {
  constructor(
    private planService: PlanService,
    private planGenerationService: PlanGenerationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all user plans' })
  async getUserPlans(@CurrentUser() user: User) {
    return this.planService.findUserPlans(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  async getPlan(@Param('id') id: string, @CurrentUser() user: User) {
    const plan = await this.planService.findById(id);

    // Check if user owns this plan
    if (plan.userId !== user.id) {
      throw new Error('Unauthorized');
    }

    return plan;
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate new plan (async)' })
  async generatePlan(@CurrentUser() user: User, @Body() body: any) {
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
  @ApiOperation({ summary: 'Generate new plan (synchronous, for testing)' })
  async generatePlanSync(@CurrentUser() user: User, @Body() body: any) {
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
    @Body() body: { rating: number; difficulty?: number; notes?: string },
  ) {
    await this.planService.completeSession(sessionId, body);
    return { message: 'Session completed successfully' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update plan status' })
  async updatePlanStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.planService.updatePlanStatus(id, body.status);
  }
}
