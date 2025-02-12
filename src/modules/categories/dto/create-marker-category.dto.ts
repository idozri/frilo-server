/** @format */

import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMarkerCategoryDto {
  @ApiProperty({ example: '66b54a6b5311236168a109ca' })
  @IsString()
  _id: string;

  @ApiProperty({ example: 'Moving Help' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'truck' })
  @IsString()
  icon: string;

  @ApiProperty({ example: '#FF5733' })
  @IsString()
  color: string;
}
