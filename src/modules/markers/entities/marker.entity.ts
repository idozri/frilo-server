/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Expose } from 'class-transformer';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from 'src/modules/categories/entities/category.entity';
import { User } from 'src/modules/users/entities/user.entity';

export type MarkerDocument = Marker & Document;

export interface Participant {
  userId: string;
  status: 'Pending' | 'accepted' | 'rejected';
  joinedAt: string;
}

export enum MarkerStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  PENDING = 'Pending',
  WAITING_FOR_APPROVAL = 'Waiting for approval',
  IN_PROGRESS = 'In progress',
}

export enum MarkerPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Marker {
  @Exclude()
  _id: MongooseSchema.Types.ObjectId;

  @Expose()
  get id(): string {
    return this._id.toString();
  }

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [{ userId: String, status: String, joinedAt: String }] })
  participants: Participant[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };

  @Prop()
  address: string;

  @Prop()
  locationDescription: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: string;

  category?: Category;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  ownerId: string;

  owner?: User;

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

// Create a compound index for geospatial queries
MarkerSchema.index({ location: '2dsphere' });

// Add virtual population
MarkerSchema.virtual('owner', {
  ref: 'User',
  localField: 'ownerId',
  foreignField: '_id',
  justOne: true,
});

MarkerSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});
