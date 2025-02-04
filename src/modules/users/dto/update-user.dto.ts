/** @format */

import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsDate,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsDate()
  @IsOptional()
  lastSeen?: Date;

  @ApiProperty({ required: false })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPhoneVerified?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  hasAcceptedSafetyGuidelines?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  hasCompletedOnboarding?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  onboardingProgress?: {
    welcomeScreenSeen: boolean;
    phoneVerified: boolean;
    safetyGuidelinesAccepted: boolean;
    tutorialCompleted: boolean;
  };
}
