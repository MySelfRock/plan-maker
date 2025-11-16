import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TemplateVersioningService } from './template-versioning.service';

@Module({
  controllers: [TemplateController],
  providers: [TemplateService, TemplateVersioningService],
  exports: [TemplateService, TemplateVersioningService],
})
export class TemplateModule {}
