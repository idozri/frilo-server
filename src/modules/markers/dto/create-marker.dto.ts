/** @format */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Location, MarkerStatus } from "../entities/marker.entity";

class LocationDto implements Location {
  @ApiProperty({ example: 32.0853 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 34.7818 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: "Tel Aviv, Israel" })
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateMarkerDto {
  @ApiProperty({ example: "Help needed with moving" })
  @IsString()
  title: string;

  @ApiProperty({ example: "Need help moving furniture to a new apartment" })
  @IsString()
  description: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: Location;

  @ApiProperty({ example: "moving-help" })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: ["image1.jpg", "image2.jpg"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: "+972123456789" })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ enum: MarkerStatus, example: MarkerStatus.PENDING })
  @IsEnum(MarkerStatus)
  @IsOptional()
  status?: MarkerStatus;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  priority?: number;
}
