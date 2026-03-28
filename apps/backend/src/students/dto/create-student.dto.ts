import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Student full name',
    example: 'Jane Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

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
    description: 'School ID where student is enrolled',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  schoolId: string;
}
