/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  MESSAGE = 'message',
  NOTIFICATION = 'notification',
  MARKER_APPLICATION = 'marker_application',
  MARKER_STATUS_UPDATE = 'marker_status_update',
  MARKER_COMPLETED = 'marker_completed',
}

export interface NotificationAction {
  type: 'marker' | 'chat';
  id: string;
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: [String] })
  userIds: string[];

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: Object, default: {} })
  readBy: Record<string, boolean>;

  @Prop({ type: Object })
  action?: NotificationAction;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
