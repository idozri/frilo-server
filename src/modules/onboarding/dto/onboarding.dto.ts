/** @format */

import {
  IsString,
  IsPhoneNumber,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneVerificationRequestDto {
  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}

export class PhoneVerificationConfirmDto {
  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class UpdateOnboardingProgressDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  welcomeScreenSeen?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  phoneVerified?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  safetyGuidelinesAccepted?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  tutorialCompleted?: boolean;
}

export class AcceptSafetyGuidelinesDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  accepted: boolean;
}
