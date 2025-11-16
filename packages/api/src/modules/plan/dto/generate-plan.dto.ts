import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

const VALID_PLAN_TYPES = ['weekly', 'monthly', '12-week'];

export class GeneratePlanDto {
  @ApiProperty({
    description: 'Profile ID to generate plan for',
    example: 'profile-uuid',
  })
  @IsString()
  profileId: string;

  @ApiProperty({
    description: 'Type of plan to generate',
    enum: VALID_PLAN_TYPES,
    example: 'weekly',
  })
  @IsString()
  @IsIn(VALID_PLAN_TYPES, { message: 'Plan type must be one of: weekly, monthly, 12-week' })
  planType: string;

  @ApiProperty({
    description: 'Plan start date (ISO 8601)',
    example: '2025-01-20T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Optional template ID to use',
    required: false,
  })
  @IsOptional()
  @IsString()
  templateId?: string;
}
