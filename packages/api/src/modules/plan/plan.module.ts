import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { PlanGenerationService } from './plan-generation.service';
import { PlanExportService } from './plan-export.service';
import { PlanAnalyticsService } from './plan-analytics.service';
import { TemplateModule } from '../template/template.module';
import { ExerciseModule} from '../exercise/exercise.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [TemplateModule, ExerciseModule, WebhookModule],
  controllers: [PlanController],
  providers: [PlanService, PlanGenerationService, PlanExportService, PlanAnalyticsService],
  exports: [PlanService, PlanExportService, PlanAnalyticsService],
})
export class PlanModule {}
