/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AchievementType } from '../types/achievement.types';

export type AchievementDocument = Achievement & Document;

// Define the rewards schema type
class AchievementRewards {
  @Prop({ required: true, type: String })
  badge: string;

  @Prop({ required: true, type: Number })
  points: number;

  @Prop({ required: true, type: String })
  unlockFeature: string;
}

@Schema({ timestamps: true })
export class Achievement {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  total: number;

  @Prop({ type: AchievementRewards })
  rewards?: AchievementRewards;

  @Prop({
    required: true,
    type: String,
    enum: [
      'markers_created',
      'markers_completed',
      'quick_response',
      'user_interactions',
    ],
  })
  type: AchievementType;
}

@Schema({ timestamps: true })
export class Badge {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  achievementId: string;
}

@Schema({ timestamps: true })
export class UserAchievement {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  achievementId: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  earnedAt?: Date;

  @Prop()
  completedAt?: Date;
}

@Schema({ timestamps: true })
export class UserBadge {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  badgeId: string;

  @Prop({ required: true })
  earnedAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
export const BadgeSchema = SchemaFactory.createForClass(Badge);
export const UserAchievementSchema =
  SchemaFactory.createForClass(UserAchievement);
export const UserBadgeSchema = SchemaFactory.createForClass(UserBadge);
