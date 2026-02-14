import { IsString, IsBoolean, IsOptional, MinLength, MaxLength, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSchoolDto {
  @ApiProperty({
    description: 'School name',
    example: 'ABC Public School',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'School address',
    example: '123 Main Street, Mumbai',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  address?: string;

  @ApiProperty({
    description: 'City where school is located',
    example: 'Mumbai',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    description: 'School contact phone',
    example: '+912212345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({
    description: 'School contact email',
    example: 'contact@abcschool.edu',
    required: false,
  })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({
    description: 'Operating days (JSON array)',
    example: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    required: false,
  })
  @IsOptional()
  @IsJSON()
  operatingDays?: string;

  @ApiProperty({
    description: 'Whether service is available',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isServiceAvailable?: boolean;
}
