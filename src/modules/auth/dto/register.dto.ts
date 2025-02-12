/** @format */

import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsBoolean,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoginWithPhoneDto } from './login-with-phone.dto';

export class RegisterDto extends LoginWithPhoneDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Whether the user has agreed to the terms',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  agreedToTerms: boolean;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  //email
  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'The OTP code for phone verification',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
