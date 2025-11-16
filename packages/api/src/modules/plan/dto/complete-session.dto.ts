import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CompleteSessionDto {
  @ApiProperty({
    description: 'Session rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;

  @ApiProperty({
    description: 'Difficulty rating (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: 'Difficulty must be at least 1' })
  @Max(5, { message: 'Difficulty must not exceed 5' })
  difficulty: number;

  @ApiProperty({
    description: 'Optional feedback notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
