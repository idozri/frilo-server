/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
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
import { Marker, MarkerSchema } from '../markers/entities/marker.entity';
import { Message, MessageSchema } from '../chats/entities/message.entity';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: Badge.name, schema: BadgeSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
      { name: Marker.name, schema: MarkerSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
