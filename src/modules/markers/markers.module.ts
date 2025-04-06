/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarkersService } from './markers.service';
import { MarkersController } from './markers.controller';
import { Marker, MarkerSchema } from './entities/marker.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { S3Module } from '../s3/s3.module';
import { CategoriesModule } from '../categories/categories.module';
import { MarkersAdapter } from './adapter/markers.adapter';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Marker.name, schema: MarkerSchema }]),
    NotificationsModule,
    S3Module,
    CategoriesModule,
    AchievementsModule,
  ],
  controllers: [MarkersController],
  providers: [MarkersService, MarkersAdapter],
  exports: [MarkersService],
})
export class MarkersModule {}
