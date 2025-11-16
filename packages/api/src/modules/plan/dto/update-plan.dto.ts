import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

const VALID_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'];

export class UpdatePlanDto {
  @ApiProperty({
    description: 'Plan name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Plan status',
    enum: VALID_STATUSES,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_STATUSES, { message: 'Status must be one of: draft, active, paused, completed, archived' })
  status?: string;
}
