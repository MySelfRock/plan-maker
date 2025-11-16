import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PlanType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export class CreatePlanDto {
  @ApiProperty({
    description: 'User profile ID',
    example: 'prof_123abc',
  })
  @IsString()
  profileId: string;

  @ApiPropertyOptional({
    description: 'Template ID to use for plan generation',
    example: 'tmpl_456def',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Type of plan to generate',
    enum: PlanType,
    default: PlanType.WEEKLY,
    example: PlanType.WEEKLY,
  })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiPropertyOptional({
    description: 'Start date for the plan (ISO 8601 format)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Number of weeks for the plan',
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
}
