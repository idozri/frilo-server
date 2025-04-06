/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Message } from './message.entity';

export type ChatDocument = Chat & Document;

export enum ChatType {
  GROUP = 'group',
  PRIVATE = 'private',
}

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: [String] })
  participants: string[];

  @Prop({ default: ChatType.GROUP })
  type: ChatType;

  @Prop()
  groupName?: string;

  @Prop()
  groupAvatar?: string;

  @Prop({ type: [String], default: [] })
  admins: string[];

  @Prop({ type: [String], default: [] })
  blockedUsers: string[];

  @Prop({ type: [String], default: [] })
  typingUsers: string[];

  @Prop({ type: [String], default: [] })
  mutedUsers: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  unreadCount: Record<string, number>;

  @Prop()
  lastMessageId?: string;

  @Prop()
  markerId?: string;

  @Prop({ type: [String], default: [] })
  messageIds: string[];

  // Virtual field - will be populated with actual Message documents
  messages?: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.virtual('messages', {
  ref: 'Message',
  localField: 'messageIds',
  foreignField: '_id',
  justOne: false,
});

ChatSchema.set('toObject', { virtuals: true });
ChatSchema.set('toJSON', { virtuals: true });
