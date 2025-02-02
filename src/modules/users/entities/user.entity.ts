/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Exclude } from 'class-transformer';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ unique: true })
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
}

export const UserSchema = SchemaFactory.createForClass(User);
