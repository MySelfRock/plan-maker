import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsInt, IsIn, IsJSON, Min, Max } from 'class-validator';

const VALID_NICHES = ['fitness', 'music', 'study', 'skills'];
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export class CreateProfileDto {
  @ApiProperty({
    description: 'Activity niche',
    enum: VALID_NICHES,
    example: 'fitness',
  })
  @IsString()
  @IsIn(VALID_NICHES, { message: 'Niche must be one of: fitness, music, study, skills' })
  niche: string;

  @ApiProperty({
    description: 'User skill level',
    enum: VALID_LEVELS,
    example: 'beginner',
  })
  @IsString()
  @IsIn(VALID_LEVELS, { message: 'Level must be one of: beginner, intermediate, advanced, expert' })
  level: string;

  @ApiProperty({
    description: 'User goals',
    type: [String],
    example: ['lose weight', 'build muscle'],
  })
  @IsArray()
  @IsString({ each: true })
  goals: string[];

  @ApiProperty({
    description: 'User constraints or limitations',
    type: [String],
    example: ['knee injury', 'limited time'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];

  @ApiProperty({
    description: 'Available equipment',
    type: [String],
    example: ['dumbbells', 'resistance bands'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiProperty({
    description: 'Weekly availability schedule',
    example: { monday: { available: true, timeSlots: ['morning', 'evening'] } },
  })
  @IsJSON()
  availability: any;

  @ApiProperty({
    description: 'Allergies or dietary restrictions',
    required: false,
  })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({
    description: 'Medical notes or considerations',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @ApiProperty({
    description: 'Preferred session length in minutes',
    example: 45,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(15, { message: 'Session length must be at least 15 minutes' })
  @Max(180, { message: 'Session length must not exceed 180 minutes' })
  preferredSessionLength?: number;
}
