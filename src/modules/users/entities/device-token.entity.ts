/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceTokenDocument = DeviceToken & Document;

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ type: Date })
  lastUsed: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);
