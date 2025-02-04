/** @format */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { CreateChatDto, ChatType } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';
import { User } from '../users/entities/user.entity';
// import { FirebaseService } from '../firebase/firebase.service';
import { SendMessageDto, MessageType } from './dto/send-message.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private usersService: UsersService,
    private s3Service: S3Service
    // private readonly firebaseService: FirebaseService
  ) {}

  async createChat(createChatDto: CreateChatDto, user: User) {
    // return this.firebaseService.chats.createOrGetChat({
    //   participants: createChatDto.participants,
    //   createdBy: user._id,
    //   type: createChatDto.type,
    //   markerId: createChatDto.markerId,
    // });
    return true;
  }

  async getChats(userId: string) {
    // return this.firebaseService.chats.getChats(userId);
    return true;
  }

  async getChat(chatId: string) {
    // return this.firebaseService.chats.getChat(chatId);
    return true;
  }

  async getChatMessages(chatId: string) {
    // return this.firebaseService.messages.getMessages(chatId);
    return true;
  }

  async sendMessage(chatId: string, messageDto: SendMessageDto, user: User) {
    const { type, text, mediaUrls, replyToMessageId, audioMetering } =
      messageDto;

    switch (type) {
      case MessageType.TEXT:
      // return this.firebaseService.messages.sendTextMessage({
      //   chatId,
      //   text,
      //   type,
      // });

      case MessageType.IMAGE:
      // return this.firebaseService.messages.sendImageMessage({
      //   chatId,
      //   text,
      //   type,
      //   mediaUrls,
      // });

      case MessageType.AUDIO:
      // return this.firebaseService.messages.sendAudioMessage({
      //   chatId,
      //   text,
      //   type,
      //   mediaUrls,
      //   audioMetering,
      // });

      default:
        throw new Error(`Unsupported message type: ${type}`);
    }
  }

  async updateTypingStatus(chatId: string, userId: string, isTyping: boolean) {
    // return this.firebaseService.chats.updateTypingStatus(
    //   chatId,
    //   userId,
    //   isTyping
    // );
    return true;
  }

  async muteChat(chatId: string, isMuted: boolean) {
    // return this.firebaseService.chats.muteChat(chatId, isMuted);
    return true;
  }

  async deleteChat(chatId: string, user: User) {
    // return this.firebaseService.chats.deleteChat(chatId);
    return true;
  }

  async addGroupParticipants(chatId: string, userIds: string[]) {
    // return this.firebaseService.chats.addGroupParticipants(chatId, userIds);
    return true;
  }

  async removeGroupParticipant(chatId: string, userId: string) {
    // return this.firebaseService.chats.removeGroupParticipant(chatId, userId);
    return true;
  }

  async updateGroupChat(
    chatId: string,
    data: { groupName?: string; groupAvatar?: string }
  ) {
    // return this.firebaseService.chats.updateGroupChat(chatId, data);
    return true;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chatModel
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async addMessage(
    userId: string,
    createMessageDto: CreateMessageDto
  ): Promise<Message> {
    const chat = await this.chatModel.findById(createMessageDto.chatId).exec();
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (!chat.participants.includes(userId)) {
      throw new UnauthorizedException('User is not a participant in this chat');
    }

    const receiverId = chat.participants.find((id) => id !== userId) || '';

    const message = new this.messageModel({
      ...createMessageDto,
      senderId: userId,
      receiverId,
    });

    const savedMessage = await message.save();

    await this.chatModel.findByIdAndUpdate(chat.id, {
      lastMessageId: savedMessage.id,
      $inc: { [`unreadCount.${receiverId}`]: 1 },
    });

    return savedMessage;
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return this.messageModel.find({ chatId }).sort({ createdAt: -1 }).exec();
  }

  async markMessageAsRead(userId: string, messageId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.messageModel.findByIdAndUpdate(messageId, {
      isRead: true,
      readAt: new Date(),
    });

    await this.chatModel.findByIdAndUpdate(message.chatId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });
  }

  private async findExistingChat(participants: string[]): Promise<Chat | null> {
    return this.chatModel
      .findOne({
        participants: { $all: participants, $size: participants.length },
        isGroupChat: false,
      })
      .exec();
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new UnauthorizedException(
        'Only the sender can delete this message'
      );
    }

    if (message.attachments && message.attachments.length > 0) {
      await Promise.all(
        message.attachments.map(async (attachment) => {
          const key = this.extractKeyFromUrl(attachment.url);
          await this.s3Service.deleteFile(key);
        })
      );
    }

    await this.messageModel.findByIdAndUpdate(messageId, {
      isDeleted: true,
    });
  }

  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Remove protocol and bucket name
  }
}
