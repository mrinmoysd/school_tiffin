import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsJSON, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

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
  })
  @IsJSON()
  operatingDays: string;

  @ApiProperty({
    description: 'Whether service is available',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isServiceAvailable?: boolean;
}
