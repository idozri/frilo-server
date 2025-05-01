/** @format */

import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '0544266611', required: false })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Phone number or email is required' })
  phoneNumber?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  agreedToTerms?: boolean;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '109876543210123456789',
    description: 'Google User ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  googleId?: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: ['skill1', 'skill2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ example: 'en' })
  @IsString()
  @IsOptional()
  language?: string = 'he';
}
