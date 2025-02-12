/** @format */

import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetInitialDataDto {
  @ApiProperty({ example: 32.0853 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 34.7818 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Radius in meters, defaults to 5000',
  })
  @IsNumber()
  @IsOptional()
  radius?: number;
}
