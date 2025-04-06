/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Exclude, Transform, Expose } from 'class-transformer';
import {
  UserAchievement,
  UserBadge,
} from 'src/modules/achievements/entities/achievement.entity';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Exclude()
  _id: Types.ObjectId;

  @Expose()
  get id(): string {
    return this._id.toString();
  }

  @Prop()
  name?: string;

  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  password?: string;

  @Prop({ default: [] })
  friendIds: string[];

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastSeen?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ unique: true, required: true })
  phoneNumber: string;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ default: false })
  hasAcceptedSafetyGuidelines: boolean;

  @Prop({ default: false })
  agreedToTerms: boolean;

  @Prop({ default: 0 })
  points: number;

  @Prop({
    default: [],
    type: [{ type: Types.ObjectId, ref: 'UserAchievement' }],
  })
  achievementIds: Types.ObjectId[];

  achievements?: UserAchievement[];

  @Prop({
    default: [],
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserBadge' }],
  })
  badgeIds: Types.ObjectId[];

  badges?: UserBadge[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('achievements', {
  ref: 'Achievement',
  localField: 'achievementIds',
  foreignField: '_id',
  justOne: false,
});

UserSchema.virtual('badges', {
  ref: 'Badge',
  localField: 'badgeIds',
  foreignField: '_id',
  justOne: false,
});
