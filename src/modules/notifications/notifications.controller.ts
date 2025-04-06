/** @format */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user/:userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getNotifications(userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markNotificationAsRead(id, userId);
  }

  @Post('device-token')
  async registerDeviceToken(
    @CurrentUser('userId') userId: string,
    @Body() body: { token: string; deviceId: string }
  ) {
    return this.notificationsService.registerDeviceToken(
      userId,
      body.token,
      body.deviceId
    );
  }

  @Delete('device-token/:deviceId')
  async removeDeviceToken(
    @CurrentUser('userId') userId: string,
    @Param('deviceId') deviceId: string
  ) {
    console.log('Removing device token:', { userId, deviceId });
    await this.notificationsService.removeDeviceToken(userId, deviceId);
    return { success: true };
  }
}
