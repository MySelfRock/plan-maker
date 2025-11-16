import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateNiche, TemplateLevel } from './create-template.dto';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Template name',
    example: 'Beginner Fitness Program',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'A comprehensive 12-week fitness program for beginners',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Template niche/category',
    enum: TemplateNiche,
    example: TemplateNiche.FITNESS,
  })
  @IsOptional()
  @IsEnum(TemplateNiche)
  niche?: TemplateNiche;

  @ApiPropertyOptional({
    description: 'Target skill level',
    enum: TemplateLevel,
    example: TemplateLevel.BEGINNER,
  })
  @IsOptional()
  @IsEnum(TemplateLevel)
  level?: TemplateLevel;

  @ApiPropertyOptional({
    description: 'AI prompt template for plan generation',
    example: 'Generate a {level} {niche} plan for {weeks} weeks...',
  })
  @IsOptional()
  @IsString()
  aiPromptTemplate?: string;

  @ApiPropertyOptional({
    description: 'Default number of weeks',
    minimum: 1,
    maximum: 52,
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  weeks?: number;

  @ApiPropertyOptional({
    description: 'Template rules/configuration',
    example: { sessionsPerWeek: 3, sessionDuration: 60 },
  })
  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sample sessions for this template',
    example: [{ title: 'Full Body Workout', duration: 60 }],
  })
  @IsOptional()
  @IsObject()
  sampleSessions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether template is public/available to all users',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
