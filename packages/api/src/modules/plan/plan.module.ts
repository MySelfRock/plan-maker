import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { PlanGenerationService } from './plan-generation.service';
import { TemplateModule } from '../template/template.module';
import { ExerciseModule} from '../exercise/exercise.module';

@Module({
  imports: [TemplateModule, ExerciseModule],
  controllers: [PlanController],
  providers: [PlanService, PlanGenerationService],
  exports: [PlanService],
})
export class PlanModule {}
