/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarkersService } from './markers.service';
import { MarkersController } from './markers.controller';
import { Marker, MarkerSchema } from './entities/marker.entity';
import { UsersModule } from '../users/users.module';
import { S3Module } from '../s3/s3.module';
import { MarkerUploadController } from './controllers/marker-upload.controller';
import { CategoriesModule } from '../categories/categories.module';
import { PassportModule } from '@nestjs/passport';
import { MarkersAdapter } from './adapter/markers.adapter';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Marker.name, schema: MarkerSchema }]),
    UsersModule,
    S3Module,
    CategoriesModule,
    PassportModule,
  ],
  controllers: [MarkersController, MarkerUploadController],
  providers: [MarkersService, MarkersAdapter],
  exports: [MarkersService],
})
export class MarkersModule {}
