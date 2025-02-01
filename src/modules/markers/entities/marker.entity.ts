/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MarkerDocument = Marker & Document;

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Participant {
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  joinedAt: string;
}

export enum MarkerStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class Marker {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [{ userId: String, status: String, joinedAt: String }] })
  participants: Participant[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: { latitude: Number, longitude: Number, address: String } })
  location: Location;

  @Prop({ required: true })
  categoryId: string;

  @Prop({ required: true })
  ownerId: string;

  @Prop({ default: 0 })
  priority: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({
    type: String,
    enum: Object.values(MarkerStatus),
    default: MarkerStatus.PENDING,
  })
  status: MarkerStatus;

  @Prop({ default: false })
  isFavorited: boolean;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  contactPhone?: string;

  @Prop({ default: 0 })
  visitCount: number;

  @Prop()
  imageUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const MarkerSchema = SchemaFactory.createForClass(Marker);
