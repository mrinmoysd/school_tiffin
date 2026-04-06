import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { INDIAN_MOBILE_WITH_COUNTRY_CODE_REGEX } from '../../common/constants/validation.constants';
import { normalizeIndianPhone } from '../../common/utils/phone.util';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Indian mobile number',
    example: '+919876543210',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Transform(({ value }) => normalizeIndianPhone(value))
  @Matches(INDIAN_MOBILE_WITH_COUNTRY_CODE_REGEX, {
    message: 'Invalid mobile number format. Enter a valid Indian mobile number.',
  })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP',
    example: '123456',
  })
  @IsNotEmpty({ message: 'OTP is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;
}
