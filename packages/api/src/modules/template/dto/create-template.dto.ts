import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsArray, IsInt, IsJSON, IsIn, IsOptional, Min, Max, MaxLength } from 'class-validator';

const VALID_NICHES = ['fitness', 'music', 'study', 'skills'];
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const VALID_TYPES = ['weekly', 'monthly', '12-week'];

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Beginner Weight Loss Program',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'A 12-week program designed for beginners...',
  })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'Activity niche',
    enum: VALID_NICHES,
    example: 'fitness',
  })
  @IsString()
  @IsIn(VALID_NICHES)
  niche: string;

  @ApiProperty({
    description: 'Target skill level',
    enum: VALID_LEVELS,
    example: 'beginner',
  })
  @IsString()
  @IsIn(VALID_LEVELS)
  level: string;

  @ApiProperty({
    description: 'Template type',
    enum: VALID_TYPES,
    example: '12-week',
  })
  @IsString()
  @IsIn(VALID_TYPES)
  type: string;

  @ApiProperty({
    description: 'Number of weeks',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  weeks?: number;

  @ApiProperty({
    description: 'Template rules (JSON)',
    example: { maxHighIntensityPerWeek: 2, minRestDays: 2 },
  })
  @IsJSON()
  rules: any;

  @ApiProperty({
    description: 'AI prompt template',
    example: 'Generate a plan for {level} users...',
  })
  @IsString()
  aiPromptTemplate: string;

  @ApiProperty({
    description: 'Make template public',
    example: false,
    default: false,
  })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({
    description: 'Template tags',
    type: [String],
    example: ['weight-loss', 'beginner'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
