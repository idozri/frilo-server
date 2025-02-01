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
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private usersService: UsersService,
    private s3Service: S3Service
  ) {}

  async createChat(
    userId: string,
    createChatDto: CreateChatDto
  ): Promise<Chat> {
    if (!createChatDto.participants.includes(userId)) {
      createChatDto.participants.push(userId);
    }

    const existingChat = await this.findExistingChat(
      createChatDto.participants
    );
    if (existingChat) {
      return existingChat;
    }

    const chat = new this.chatModel({
      ...createChatDto,
      admins: createChatDto.isGroupChat ? [userId] : [],
      unreadCount: createChatDto.participants.reduce(
        (acc, id) => ({ ...acc, [id]: 0 }),
        {}
      ),
    });

    return chat.save();
  }

  async getChat(chatId: string): Promise<Chat> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) {
      throw new NotFoundException(`Chat #${chatId} not found`);
    }
    return chat;
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

  async updateTypingStatus(
    chatId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    const update = isTyping
      ? { $addToSet: { typingUsers: userId } }
      : { $pull: { typingUsers: userId } };

    await this.chatModel.findByIdAndUpdate(chatId, update).exec();
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
