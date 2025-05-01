/** @format */

import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'atLeastOneIdentifier', async: false })
export class AtLeastOneIdentifierConstraint
  implements ValidatorConstraintInterface
{
  validate(object: RegisterUserDto, args: ValidationArguments) {
    return !!object.phoneNumber || !!object.email || !!object.googleId;
  }

  defaultMessage(args: ValidationArguments) {
    return 'At least one identifier (phoneNumber, email, or googleId) must be provided.';
  }
}

export class RegisterUserDto {
  @ApiPropertyOptional({
    description: 'User phone number (E.164 format recommended)',
    example: '+15551234567',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.email && !o.googleId) // Make optional if email or googleId exists
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  @ValidateIf((o) => !o.phoneNumber && !o.googleId) // Make optional if phone or googleId exists
  email?: string;

  @ApiPropertyOptional({
    description: 'User password',
    example: 'password',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'Google User ID from OAuth',
    example: '109876543210123456789',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.phoneNumber && !o.email) // Make optional if phone or email exists
  googleId?: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Short user bio',
    example: 'Loves helping others!',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'List of user skills',
    example: ['Gardening', 'Cooking', 'Programming'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  skills?: string[];

  @ApiPropertyOptional({
    description: 'User language',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string = 'he';

  @ApiPropertyOptional({
    description: 'User agreed to terms',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  agreedToTerms?: boolean;

  // Custom validation to ensure at least one identifier is present
  @Validate(AtLeastOneIdentifierConstraint)
  atLeastOneIdentifier: boolean; // Dummy field for the validator
}
