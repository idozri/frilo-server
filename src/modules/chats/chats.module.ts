/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { Chat, ChatSchema } from './entities/chat.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { UsersModule } from '../users/users.module';
import { S3Module } from '../s3/s3.module';
import { ChatUploadController } from './controllers/chat-upload.controller';
// import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    UsersModule,
    S3Module,
    // FirebaseModule,
    AuthModule,
  ],
  controllers: [ChatsController, ChatUploadController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
