import {
  IsEmail,
  IsString,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User phone number in Indian format',
    example: '+919876543210',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Invalid Indian phone number format. Must be in format: +91XXXXXXXXXX',
  })
  phone?: string;

  @ApiProperty({
    description: 'User profile image URL',
    example: 'https://bucket.s3.region.amazonaws.com/users/uuid.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string | null;
}
