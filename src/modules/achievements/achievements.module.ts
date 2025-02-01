/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementsService } from './achievements.service';
import {
  Achievement,
  AchievementSchema,
  Badge,
  BadgeSchema,
  UserAchievement,
  UserAchievementSchema,
  UserBadge,
  UserBadgeSchema,
} from './entities/achievement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: Badge.name, schema: BadgeSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
    ]),
  ],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
