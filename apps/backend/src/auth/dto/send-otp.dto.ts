import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number (Indian format)',
    example: '+919876543210',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Invalid Indian phone number format. Must be in format: +91XXXXXXXXXX',
  })
  phone: string;
}
