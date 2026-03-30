import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { INDIAN_MOBILE_WITH_COUNTRY_CODE_REGEX } from '../../common/constants/validation.constants';
import { normalizeIndianPhone } from '../../common/utils/phone.util';

export class SendOtpDto {
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
}
