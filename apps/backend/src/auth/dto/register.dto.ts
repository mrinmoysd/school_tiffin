import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  EMAIL_VALIDATION_REGEX,
  INDIAN_PHONE_WITH_COUNTRY_CODE_REGEX,
} from '../../common/constants/validation.constants';
import { normalizeIndianPhone } from '../../common/utils/phone.util';

export class RegisterDTO {
  @ApiProperty({
    example: 'parent@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @Matches(EMAIL_VALIDATION_REGEX, { message: 'email must be a valid email' })
  email: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number (mobile or landline)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeIndianPhone(value))
  @Matches(INDIAN_PHONE_WITH_COUNTRY_CODE_REGEX, {
    message: 'Invalid phone number format. Enter a valid Indian mobile or landline number.',
  })
  phone?: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;
}
