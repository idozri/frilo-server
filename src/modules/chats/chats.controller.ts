/** @format */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ChatsService } from "./chats.service";
import { CreateChatDto } from "./dto/create-chat.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("chats")
@Controller("chats")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new chat" })
  @ApiResponse({ status: 201, description: "Chat created successfully." })
  async createChat(@Request() req, @Body() createChatDto: CreateChatDto) {
    return this.chatsService.createChat(req.user.userId, createChatDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all chats for the current user" })
  @ApiResponse({ status: 200, description: "Returns all user chats." })
  async getUserChats(@Request() req) {
    return this.chatsService.getUserChats(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific chat" })
  @ApiResponse({ status: 200, description: "Returns the chat." })
  @ApiResponse({ status: 404, description: "Chat not found." })
  async getChat(@Param("id") id: string) {
    return this.chatsService.getChat(id);
  }

  @Post(":chatId/messages")
  @ApiOperation({ summary: "Send a message in a chat" })
  @ApiResponse({ status: 201, description: "Message sent successfully." })
  async addMessage(
    @Request() req,
    @Param("chatId") chatId: string,
    @Body() createMessageDto: CreateMessageDto
  ) {
    return this.chatsService.addMessage(req.user.userId, {
      ...createMessageDto,
      chatId,
    });
  }

  @Get(":chatId/messages")
  @ApiOperation({ summary: "Get all messages in a chat" })
  @ApiResponse({ status: 200, description: "Returns all chat messages." })
  async getMessages(@Param("chatId") chatId: string) {
    return this.chatsService.getMessages(chatId);
  }

  @Put("messages/:messageId/read")
  @ApiOperation({ summary: "Mark a message as read" })
  @ApiResponse({ status: 200, description: "Message marked as read." })
  async markMessageAsRead(
    @Request() req,
    @Param("messageId") messageId: string
  ) {
    return this.chatsService.markMessageAsRead(req.user.userId, messageId);
  }

  @Delete("messages/:messageId")
  @ApiOperation({ summary: "Delete a message" })
  @ApiResponse({ status: 200, description: "Message deleted successfully." })
  async deleteMessage(@Request() req, @Param("messageId") messageId: string) {
    return this.chatsService.deleteMessage(req.user.userId, messageId);
  }

  @Put(":chatId/typing")
  @ApiOperation({ summary: "Update typing status" })
  @ApiResponse({ status: 200, description: "Typing status updated." })
  async updateTypingStatus(
    @Request() req,
    @Param("chatId") chatId: string,
    @Body("isTyping") isTyping: boolean
  ) {
    return this.chatsService.updateTypingStatus(
      chatId,
      req.user.userId,
      isTyping
    );
  }
}
