/** @format */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { CreateChatDto, ChatType } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';
import { User } from '../users/entities/user.entity';
// import { FirebaseService } from '../firebase/firebase.service';
import { SendMessageDto, MessageType } from './dto/send-message.dto';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { MongoUtils } from 'src/utils/mongodb.utils';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/chat',
})
@Injectable()
export class ChatsService {
  @WebSocketServer() server: Server;

  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private usersService: UsersService,
    private s3Service: S3Service,
    private notificationsService: NotificationsService
    // private readonly firebaseService: FirebaseService
  ) {}

  async createChat(
    createChatDto: CreateChatDto,
    user: User
  ): Promise<ApiResponse<{ id: string }>> {
    // check if chat already exists
    // if it does, return the chat and add the user to the participants
    const existingChat = await this.chatModel.findOne({
      markerId: createChatDto.markerId,
    });

    if (existingChat) {
      return {
        isSuccess: true,
        message: 'Chat already exists',
        data: { id: existingChat._id.toString() },
      };
    }

    const chat = await this.chatModel.create({
      ...createChatDto,
      participants: [...createChatDto.participants],
    });

    return {
      isSuccess: true,
      message: 'Chat created successfully',
      data: { id: chat._id.toString() },
    };
  }

  async getChats(userId: string): Promise<Chat[]> {
    return this.chatModel.find({ participants: userId }).exec();
  }

  async getChatsWithMessages(userId: string): Promise<Chat[]> {
    console.log('getChatsWithMessages', userId);
    const chats = await this.chatModel
      .find({ participants: userId })
      .populate('messages')
      .exec();

    return chats;
  }

  async getChat(chatId: string) {
    // get chat with messages the messages should be sorted by createdAt descending
    const chat = await this.chatModel
      .findById(chatId)
      .populate({
        path: 'messages',
        options: { sort: { createdAt: -1 } },
      })
      .exec();
    console.log('chat', chat);
    return chat;
  }

  async getChatMessages(chatId: string) {
    return this.messageModel.find({ chatId }).exec();
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(client: Socket, chatId: string) {
    console.log(`Client ${client.id} joining chat ${chatId}`);
    client.join(chatId);
    client.emit('joinedChat', chatId);
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(client: Socket, chatId: string) {
    console.log(`Client ${client.id} leaving chat ${chatId}`);
    client.leave(chatId);
  }

  async sendMessage(
    chatId: string,
    messageDto: SendMessageDto,
    userId: string
  ) {
    try {
      const { type, text, mediaUrls, replyToMessageId, audioMetering } =
        messageDto;

      // Validate chat exists and user is a participant
      const chat = await this.chatModel.findById(chatId);
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      if (!chat.participants.includes(userId)) {
        throw new UnauthorizedException(
          'User is not a participant in this chat'
        );
      }

      const messageData = {
        chatId,
        text: text || '',
        type,
        senderId: userId,
        mediaUrls: mediaUrls || [],
        audioMetering: audioMetering || null,
        replyToMessageId,
        createdAt: new Date(),
        isRead: false,
        isDelivered: false,
      };

      const message = await this.messageModel.create(messageData);

      // Update the chat's last message
      await this.chatModel.findByIdAndUpdate(chatId, {
        lastMessageId: message._id,
        messageIds: [...chat.messageIds, message._id],
        updatedAt: new Date(),
      });

      // Get sender's name for notification
      const sender = await this.usersService.findOne(userId);
      const senderName = sender?.name || 'Someone';

      // Send notifications to all participants except the sender
      const recipientIds = chat.participants.filter((id) => id !== userId);
      if (recipientIds.length > 0) {
        const notificationTitle =
          chat.type === ChatType.GROUP
            ? `${chat.groupName || 'Group Chat'}`
            : senderName;

        const notificationBody =
          type === MessageType.TEXT
            ? text || ''
            : type === MessageType.IMAGE
              ? '📷 Image'
              : type === MessageType.AUDIO
                ? '🎤 Voice message'
                : type === MessageType.VIDEO
                  ? '🎥 Video'
                  : 'New message';

        await this.notificationsService.addNotification({
          userIds: recipientIds,
          title: notificationTitle,
          message: notificationBody,
          type: NotificationType.MESSAGE,
          action: {
            type: 'chat',
            id: chatId,
          },
        });
      }

      // Log before emitting
      console.log('Emitting new message to room:', chatId, message);

      // Emit the new message to all clients in the chat room
      this.server.to(chatId).emit('newMessage', {
        ...message.toObject(),
        _id: message._id.toString(),
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async updateTypingStatus(chatId: string, userId: string, isTyping: boolean) {
    // Emit typing status to all clients in the chat room
    this.server.to(chatId).emit('typingStatus', { userId, isTyping });
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
