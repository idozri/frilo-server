/** @format */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MarkerStatus } from '../entities/marker.entity';
import { CreateMarkerCategoryDto } from 'src/modules/categories/dto/create-marker-category.dto';

// class LocationDto implements Location {
//   @ApiProperty({ example: 'Point' })
//   @IsString()
//   type: string = 'Point';

//   @ApiProperty({ example: [34.7818, 32.0853] })
//   @IsArray()
//   @IsNumber({}, { each: true })
//   coordinates: number[];

//   @ApiProperty({ example: 'Tel Aviv, Israel' })
//   @IsString()
//   @IsOptional()
//   address?: string;

//   @ApiProperty({ example: 'Near the main entrance' })
//   @IsString()
//   @IsOptional()
//   description?: string;
// }

export class CreateMarkerDto {
  @ApiProperty({ example: 'Help needed with moving' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Need help moving furniture to a new apartment' })
  @IsString()
  description: string;

  @ApiProperty({ example: [34.7818, 32.0853] })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];

  @ApiProperty({ example: 'Tel Aviv, Israel' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Point' })
  @IsString()
  @IsOptional()
  locationType?: string;

  @ApiProperty({ example: 'Near the main entrance' })
  @IsString()
  @IsOptional()
  locationDescription?: string;

  @ApiProperty({ type: String })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: ['data:image/jpeg;base64,...'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: '+972123456789' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ enum: MarkerStatus, example: MarkerStatus.ACTIVE })
  @IsEnum(MarkerStatus)
  @IsOptional()
  status?: MarkerStatus;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  priority?: number;
}
