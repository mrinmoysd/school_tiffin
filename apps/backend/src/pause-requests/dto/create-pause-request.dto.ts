import { IsUUID, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePauseRequestDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({
    description: 'Pause start date (ISO 8601)',
    example: '2026-02-15',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Pause end date (ISO 8601)',
    example: '2026-02-20',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Reason for pause',
    example: 'Family vacation',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
