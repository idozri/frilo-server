/** @format */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleMapsService } from './google-maps.service';
import { GoogleMapsController } from './google-maps.controller';

@Module({
  imports: [ConfigModule],
  controllers: [GoogleMapsController],
  providers: [GoogleMapsService],
  exports: [GoogleMapsService],
})
export class GoogleModule {}
