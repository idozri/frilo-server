/** @format */

import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Moving Help' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'truck' })
  @IsString()
  icon: string;

  @ApiProperty({ example: '#FF5733' })
  @IsString()
  color: string;

  @ApiProperty({ example: 'Help with moving and transportation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'moving' })
  @IsString()
  type: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
