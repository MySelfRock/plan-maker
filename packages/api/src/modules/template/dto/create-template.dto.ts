import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TemplateNiche {
  FITNESS = 'fitness',
  MUSIC = 'music',
  STUDY = 'study',
  SKILLS = 'skills',
}

export enum TemplateLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Beginner Fitness Program',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'A comprehensive 12-week fitness program for beginners',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Template niche/category',
    enum: TemplateNiche,
    example: TemplateNiche.FITNESS,
  })
  @IsEnum(TemplateNiche)
  niche: TemplateNiche;

  @ApiProperty({
    description: 'Target skill level',
    enum: TemplateLevel,
    example: TemplateLevel.BEGINNER,
  })
  @IsEnum(TemplateLevel)
  level: TemplateLevel;

  @ApiProperty({
    description: 'AI prompt template for plan generation',
    example: 'Generate a {level} {niche} plan for {weeks} weeks...',
  })
  @IsString()
  aiPromptTemplate: string;

  @ApiPropertyOptional({
    description: 'Default number of weeks',
    minimum: 1,
    maximum: 52,
    default: 12,
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
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
