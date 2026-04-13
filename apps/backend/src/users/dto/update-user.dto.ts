import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  EMAIL_VALIDATION_REGEX,
  INDIAN_PHONE_WITH_COUNTRY_CODE_REGEX,
} from '../../common/constants/validation.constants';
import { normalizeIndianPhone } from '../../common/utils/phone.util';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @Matches(EMAIL_VALIDATION_REGEX, { message: 'email must be a valid email' })
  email?: string;

  @ApiProperty({
    description: 'User phone number (mobile or landline, Indian format)',
    example: '+919876543210',
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
    description: 'User profile image URL',
    example: 'https://res.cloudinary.com/demo/image/upload/v1736793442/users/profile.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  profileImageUrl?: string | null;
}
