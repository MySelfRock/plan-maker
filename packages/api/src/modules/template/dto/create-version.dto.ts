import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVersionDto {
  @ApiProperty({
    description: 'Description of changes in this version',
    example: 'Updated AI prompt template to include more personalization',
  })
  @IsString()
  changes: string;
}
