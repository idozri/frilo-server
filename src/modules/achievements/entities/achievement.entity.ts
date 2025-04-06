/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { AchievementType } from '../types/achievement.types';
import { Types } from 'mongoose';

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

@Schema()
export class Achievement extends Document {
  _id: Types.ObjectId;

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

  @Prop({ default: false })
  isHidden: boolean;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ type: Object })
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

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserAchievement {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Achievement',
  })
  achievementId: string;

  achievement?: Achievement;

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

  @Prop({ type: Types.ObjectId, ref: Badge.name })
  badgeId: string;

  badge?: Badge;

  @Prop({ required: true })
  earnedAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
export const BadgeSchema = SchemaFactory.createForClass(Badge);
export const UserAchievementSchema =
  SchemaFactory.createForClass(UserAchievement);
export const UserBadgeSchema = SchemaFactory.createForClass(UserBadge);

UserAchievementSchema.virtual('achievement', {
  ref: Achievement.name,
  localField: 'achievementId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON/Object
UserAchievementSchema.set('toJSON', { virtuals: true });
UserAchievementSchema.set('toObject', { virtuals: true });
