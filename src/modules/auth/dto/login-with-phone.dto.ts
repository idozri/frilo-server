/** @format */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginWithPhoneDto {
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'The OTP of the user',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
