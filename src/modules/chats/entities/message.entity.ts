/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document;

export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'file';

export interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  chatId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  receiverId: string;

  @Prop({ default: '' })
  text: string;

  @Prop({
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'file'],
    default: 'text',
  })
  type: MessageType;

  @Prop({ type: [String], default: [] })
  mediaUrls: string[];

  @Prop({ type: [Number], default: null })
  audioMetering?: number[];

  @Prop()
  replyToMessageId?: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isDelivered: boolean;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ type: [Object], default: [] })
  attachments: Attachment[];

  @Prop({ type: [String], default: [] })
  readBy: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
