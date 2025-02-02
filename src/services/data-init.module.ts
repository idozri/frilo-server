/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataInitService } from './data-init.service';
import {
  Category,
  CategorySchema,
} from '../modules/categories/entities/category.entity';
import {
  Achievement,
  AchievementSchema,
  Badge,
  BadgeSchema,
} from '../modules/achievements/entities/achievement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: Badge.name, schema: BadgeSchema },
    ]),
  ],
  providers: [DataInitService],
  exports: [DataInitService],
})
export class DataInitModule {}
