/** @format */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  GeocodeRequest,
  PlaceAutocompleteRequest,
} from '@googlemaps/google-maps-services-js';

@Injectable()
export class GoogleMapsService {
  private client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({});
  }

  async geocode(address: string) {
    const request: GeocodeRequest = {
      params: {
        address,
        key: this.configService.get<string>('GOOGLE_MAPS_API_KEY'),
      },
    };

    const response = await this.client.geocode(request);
    return response.data.results;
  }

  async reverseGeocode(lat: number, lng: number) {
    const request: GeocodeRequest = {
      params: {
        address: `${lat},${lng}`,
        key: this.configService.get<string>('GOOGLE_MAPS_API_KEY'),
      },
    };

    const response = await this.client.geocode(request);
    return response.data.results;
  }

  async getPlaceAutocomplete(input: string) {
    const request: PlaceAutocompleteRequest = {
      params: {
        input,
        types: 'address',
        key: this.configService.get<string>('GOOGLE_MAPS_API_KEY'),
      },
    };

    const response = await this.client.placeAutocomplete(request);
    return response.data.predictions;
  }

  async getPlaceDetails(placeId: string) {
    const response = await this.client.placeDetails({
      params: {
        place_id: placeId,
        key: this.configService.get<string>('GOOGLE_MAPS_API_KEY'),
      },
    });
    return response.data.result;
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
