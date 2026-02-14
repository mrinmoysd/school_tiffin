import { IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum DeviceType {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM device token',
    example: 'dK1_xyz...abc123',
  })
  @IsString()
  @MinLength(10)
  token: string;

  @ApiProperty({
    description: 'Device type',
    enum: DeviceType,
    example: 'ANDROID',
  })
  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
