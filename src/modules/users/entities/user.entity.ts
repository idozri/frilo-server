/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
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

  @Prop({
    unique: true,
    sparse: true,
    required: function (this: User) {
      return !this.phoneNumber;
    },
  })
  email?: string;

  // googleId is optional, unique when present, but allows multiple nulls/absent fields due to sparse index.
  @Prop({ required: false, unique: true, sparse: true })
  googleId?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  bio?: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop()
  @Exclude()
  password?: string;

  @Prop({ default: [] })
  friendIds: string[];

  @Prop({ type: Number, default: 0 })
  completedRequests: number;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastSeen?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    unique: true,
    required: function (this: User) {
      return !this.email && !this.phoneNumber;
    },
    sparse: true,
  })
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
    type: {
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      idVerified: { type: Boolean, default: false },
    },
    default: {},
  })
  verificationStatus: {
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified: boolean;
  };

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  location?: {
    type: 'Point';
    coordinates: number[];
  };

  @Prop({ default: 'en' })
  language: 'en' | 'he';

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
