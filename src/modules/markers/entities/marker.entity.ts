/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from 'src/modules/categories/entities/category.entity';

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
  WAITING_FOR_APPROVAL = 'waiting_for_approval',
  IN_PROGRESS = 'in_progress',
}

export enum MarkerPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
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

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Category;

  @Prop({ required: true })
  ownerId: string;

  @Prop({
    type: String,
    enum: Object.values(MarkerPriority),
    default: MarkerPriority.MEDIUM,
  })
  priority: MarkerPriority;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({
    type: String,
    enum: Object.values(MarkerStatus),
    default: MarkerStatus.ACTIVE,
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
