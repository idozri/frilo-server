/** @format */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GoogleMapsService } from './google-maps.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('google-maps')
@Controller('google-maps')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class GoogleMapsController {
  constructor(private readonly googleMapsService: GoogleMapsService) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get place autocomplete suggestions' })
  @ApiQuery({ name: 'input', type: String })
  async getPlaceAutocomplete(@Query('input') input: string) {
    return this.googleMapsService.getPlaceAutocomplete(input);
  }

  @Get('place-details')
  @ApiOperation({ summary: 'Get place details' })
  @ApiQuery({ name: 'placeId', type: String })
  async getPlaceDetails(@Query('placeId') placeId: string) {
    return this.googleMapsService.getPlaceDetails(placeId);
  }

  @Get('reverse-geocode')
  @ApiOperation({ summary: 'Get address from coordinates' })
  @ApiQuery({ name: 'latitude', type: Number })
  @ApiQuery({ name: 'longitude', type: Number })
  async reverseGeocode(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number
  ) {
    return this.googleMapsService.reverseGeocode(latitude, longitude);
  }
}
