import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

const VALID_PLAN_TIERS = ['free', 'starter', 'pro', 'team', 'enterprise'];

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan tier',
    enum: VALID_PLAN_TIERS,
    example: 'pro',
  })
  @IsString()
  @IsIn(VALID_PLAN_TIERS, { message: 'Plan tier must be one of: free, starter, pro, team, enterprise' })
  planTier: string;

  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890',
    required: false,
  })
  @IsString()
  paymentMethodId?: string;
}
