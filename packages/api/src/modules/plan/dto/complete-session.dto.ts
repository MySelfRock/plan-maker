import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteSessionDto {
  @ApiProperty({
    description: 'Session rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Session difficulty rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({
    description: 'Additional notes or feedback',
    example: 'Great workout! Felt a bit challenging towards the end.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
