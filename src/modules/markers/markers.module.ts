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

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Marker.name, schema: MarkerSchema }]),
    UsersModule,
    S3Module,
    CategoriesModule,
  ],
  controllers: [MarkersController, MarkerUploadController],
  providers: [MarkersService],
  exports: [MarkersService],
})
export class MarkersModule {}
