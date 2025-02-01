/** @format */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      this.userSockets.set(userId, client.id);
      await this.usersService.update(userId, { isOnline: true });

      client.join(`user_${userId}`);
      this.server.emit('userOnline', { userId });
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = this.getUserIdFromSocket(client.id);
      if (userId) {
        this.userSockets.delete(userId);
        await this.usersService.update(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        this.server.emit('userOffline', { userId });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(client: Socket, chatId: string) {
    client.join(`chat_${chatId}`);
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(client: Socket, chatId: string) {
    client.leave(`chat_${chatId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, { chatId, isTyping }: any) {
    const userId = this.getUserIdFromSocket(client.id);
    if (userId) {
      client.to(`chat_${chatId}`).emit('userTyping', { userId, isTyping });
    }
  }

  notifyNewMessage(chatId: string, message: any) {
    this.server.to(`chat_${chatId}`).emit('newMessage', message);
  }

  notifyMarkerUpdate(markerId: string, update: any) {
    this.server.emit('markerUpdate', { markerId, ...update });
  }

  private getUserIdFromSocket(socketId: string): string | undefined {
    for (const [userId, id] of this.userSockets.entries()) {
      if (id === socketId) return userId;
    }
    return undefined;
  }
}
