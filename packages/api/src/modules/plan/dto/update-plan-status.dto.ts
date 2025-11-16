import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdatePlanStatusDto {
  @ApiProperty({
    description: 'New status for the plan',
    enum: PlanStatus,
    example: PlanStatus.ACTIVE,
  })
  @IsEnum(PlanStatus)
  status: PlanStatus;
}
