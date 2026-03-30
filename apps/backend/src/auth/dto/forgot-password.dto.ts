import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';
import { EMAIL_VALIDATION_REGEX } from '../../common/constants/validation.constants';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address',
    example: 'parent@example.com',
  })
  @IsEmail()
  @Matches(EMAIL_VALIDATION_REGEX, { message: 'email must be a valid email' })
  email: string;
}
