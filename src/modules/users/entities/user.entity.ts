/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Exclude } from 'class-transformer';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop()
  name?: string;

  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop()
  displayName?: string;

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
  hasCompletedOnboarding: boolean;

  @Prop({ default: false })
  agreedToTerms: boolean;

  @Prop({
    type: Object,
    default: {
      welcomeScreenSeen: false,
      phoneVerified: false,
      safetyGuidelinesAccepted: false,
      tutorialCompleted: false,
    },
  })
  onboardingProgress: {
    welcomeScreenSeen: boolean;
    phoneVerified: boolean;
    safetyGuidelinesAccepted: boolean;
    tutorialCompleted: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
