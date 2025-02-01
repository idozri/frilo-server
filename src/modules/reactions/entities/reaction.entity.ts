/** @format */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReactionDocument = Reaction & Document;

@Schema({ timestamps: true })
export class Reaction {
  @Prop({ required: true })
  messageId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  emoji: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

@Schema()
export class MessageReactions {
  @Prop({ required: true })
  messageId: string;

  @Prop({ type: Object })
  reactions: {
    [userId: string]: string[]; // array of emojis per user
  };
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
export const MessageReactionsSchema =
  SchemaFactory.createForClass(MessageReactions);
