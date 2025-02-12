/** @format */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: 201, description: 'Chat created successfully.' })
  async createChat(
    @Body() createChatDto: CreateChatDto,
    @GetUser() user: User
  ) {
    return this.chatsService.createChat(createChatDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for current user' })
  async getChats(@GetUser() user: User) {
    return this.chatsService.getChats(user.id);
  }

  @Get('with-messages')
  @ApiOperation({ summary: 'Get all chats for current user with messages' })
  async getChatsWithMessages(@GetUser() user: User) {
    return this.chatsService.getChatsWithMessages(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  async getChat(@Param('id') id: string) {
    return this.chatsService.getChat(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a chat' })
  async getChatMessages(@Param('id') chatId: string) {
    return this.chatsService.getChatMessages(chatId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in chat' })
  async sendMessage(
    @Param('id') chatId: string,
    @Body() messageDto: SendMessageDto,
    @GetUser() user: User
  ) {
    return this.chatsService.sendMessage(chatId, messageDto, user);
  }

  @Put(':id/typing')
  @ApiOperation({ summary: 'Update typing status' })
  async updateTypingStatus(
    @Param('id') chatId: string,
    @GetUser() user: User,
    @Query('isTyping') isTyping: boolean
  ) {
    return this.chatsService.updateTypingStatus(chatId, user.id, isTyping);
  }

  @Put(':id/mute')
  @ApiOperation({ summary: 'Mute/unmute chat' })
  async muteChat(
    @Param('id') chatId: string,
    @GetUser() user: User,
    @Query('isMuted') isMuted: boolean
  ) {
    return this.chatsService.muteChat(chatId, isMuted);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete chat' })
  async deleteChat(@Param('id') chatId: string, @GetUser() user: User) {
    return this.chatsService.deleteChat(chatId, user);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participants to group chat' })
  async addParticipants(
    @Param('id') chatId: string,
    @Body('userIds') userIds: string[]
  ) {
    return this.chatsService.addGroupParticipants(chatId, userIds);
  }

  @Delete(':id/participants/:userId')
  @ApiOperation({ summary: 'Remove participant from group chat' })
  async removeParticipant(
    @Param('id') chatId: string,
    @Param('userId') userId: string
  ) {
    return this.chatsService.removeGroupParticipant(chatId, userId);
  }

  @Put(':id/group')
  @ApiOperation({ summary: 'Update group chat details' })
  async updateGroupChat(
    @Param('id') chatId: string,
    @Body() updateData: { groupName?: string; groupAvatar?: string }
  ) {
    return this.chatsService.updateGroupChat(chatId, updateData);
  }
}
