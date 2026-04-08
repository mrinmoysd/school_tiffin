import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Student first name',
    example: 'Jane',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastName: string;

  @ApiProperty({
    description: 'Student profile image URL or upload path',
    example: '/uploads/parents/uuid/students/student.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Student image URL/path (legacy alias for profileImageUrl)',
    example: '/uploads/parents/uuid/students/student.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiProperty({
    description: 'Student grade/class',
    example: '5',
  })
  @IsString()
  grade: string;

  @ApiProperty({
    description: 'Student date of birth (ISO date format)',
    example: '2016-08-19',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'School ID where student is enrolled',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  schoolId: string;
}
