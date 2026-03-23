import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateTaxSettingDto {
  @ApiProperty({
    description: 'Global tax percentage to apply across the app',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxPercentage: number;
}
