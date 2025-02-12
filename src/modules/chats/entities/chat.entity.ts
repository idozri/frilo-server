/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Message } from './message.entity';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true, type: [String] })
  participants: string[];

  @Prop({ default: false })
  isGroupChat: boolean;

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

  @Prop({ type: [Message], default: [] })
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
