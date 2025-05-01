/** @format */

import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckUserExistsDto {
  @ApiProperty({
    description: 'The method to check existence by (email or phone)',
    enum: ['email', 'phone'],
  })
  @IsIn(['email', 'phone'])
  method: 'email' | 'phone';

  @ApiPropertyOptional({
    description: "The phone number of the user (required if method is 'phone')",
    example: '+1234567890',
  })
  @IsOptional()
  @ValidateIf((o) => o.method === 'phone')
  @IsPhoneNumber(null, { message: 'Phone number must be a valid phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description:
      "The email address of the user (required if method is 'email')",
    example: 'user@example.com',
  })
  @IsOptional()
  @ValidateIf((o) => o.method === 'email')
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;
}
