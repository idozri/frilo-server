/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import {
  HelpPoint,
  HelpPointSchema,
} from '../help-points/entities/help-point.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Chat, ChatSchema } from '../chats/entities/chat.entity';
import { Message, MessageSchema } from '../chats/entities/message.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HelpPoint.name, schema: HelpPointSchema },
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
