import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateStudentDto {
  @ApiProperty({
    description: 'Student first name',
    example: 'Jane',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName?: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastName?: string;

  @ApiProperty({
    description: 'Student profile image URL or upload path',
    example: '/uploads/parents/uuid/students/student.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  profileImageUrl?: string | null;

  @ApiProperty({
    description: 'Student image URL/path (legacy alias for profileImageUrl)',
    example: '/uploads/parents/uuid/students/student.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string | null;

  @ApiProperty({
    description: 'Student grade/class',
    example: '6',
    required: false,
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({
    description: 'Student date of birth (ISO date format). Pass null to clear DOB.',
    example: '2016-08-19',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiProperty({
    description: 'School ID where student is enrolled',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
