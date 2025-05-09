/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  code: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: () => Date.now() + 5 * 60 * 1000 }) // 5 min expiry
  expiresAt: Date;

  @Prop({ default: null })
  blockedUntil: Date;

  @Prop({ default: false })
  isVerifiedOTP: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
