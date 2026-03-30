import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  EMAIL_VALIDATION_REGEX,
  INDIAN_PHONE_WITH_COUNTRY_CODE_REGEX,
} from '../../common/constants/validation.constants';
import { normalizeIndianPhone } from '../../common/utils/phone.util';

export class CreateSchoolDto {
  @ApiProperty({
    description: 'School name',
    example: 'ABC Public School',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Unique school code',
    example: 'ABC001',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'School address',
    example: '123 Main Street, Mumbai',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  address: string;

  @ApiProperty({
    description: 'City where school is located',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    description: 'State where school is located',
    example: 'Maharashtra',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state?: string;

  @ApiProperty({
    description: 'Pincode / postal code',
    example: '400001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @ApiProperty({
    description: 'School contact phone (mobile or landline)',
    example: '+912212345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeIndianPhone(value))
  @Matches(INDIAN_PHONE_WITH_COUNTRY_CODE_REGEX, {
    message: 'Invalid contactPhone format. Enter a valid Indian mobile or landline number.',
  })
  contactPhone?: string;

  @ApiProperty({
    description: 'School contact email',
    example: 'contact@abcschool.edu',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(EMAIL_VALIDATION_REGEX, { message: 'contactEmail must be a valid email' })
  contactEmail?: string;

  @ApiProperty({
    description: 'Operating days (comma-separated values)',
    example: 'MON,TUE,WED,THU,FRI',
  })
  @IsString()
  operatingDays: string;

  @ApiProperty({
    description: 'Delivery instructions',
    example: 'Deliver to the school cafeteria between 11:30 AM - 12:00 PM',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  deliveryInstructions?: string;

  @ApiProperty({
    description: 'Whether service is available',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isServiceAvailable?: boolean;
}
