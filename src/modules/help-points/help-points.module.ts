/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HelpPointsService } from './help-points.service';
import { HelpPointsController } from './help-points.controller';
import { HelpPoint, HelpPointSchema } from './entities/help-point.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { S3Module } from '../s3/s3.module';
import { CategoriesModule } from '../categories/categories.module';
import { HelpPointsAdapter } from './adapter/help-points.adapter';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HelpPoint.name, schema: HelpPointSchema },
    ]),
    NotificationsModule,
    S3Module,
    CategoriesModule,
    AchievementsModule,
  ],
  controllers: [HelpPointsController],
  providers: [HelpPointsService, HelpPointsAdapter],
  exports: [HelpPointsService],
})
export class HelpPointsModule {}
