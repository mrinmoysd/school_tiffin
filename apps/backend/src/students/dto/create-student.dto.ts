import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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
