/** @format */

import { Injectable } from '@nestjs/common';
import { Notification, NotificationType } from './entities/notification.entity';
import { DeviceToken } from '../users/entities/device-token.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(DeviceToken.name)
    private deviceTokenModel: Model<DeviceToken>
  ) {}

  async addNotification(notification: {
    userIds: string[];
    title: string;
    message: string;
    type: NotificationType;
    action?: { type: 'helpPoint' | 'chat'; id: string };
  }): Promise<Notification> {
    // Initialize readBy map with all recipients marked as unread
    const readBy: Record<string, boolean> = {};
    notification.userIds.forEach((userId) => {
      readBy[userId] = false;
    });

    // Create notification in database
    const newNotification = new this.notificationModel({
      ...notification,
      readBy,
      createdAt: new Date(),
    });
    await newNotification.save();

    // Send push notification to all recipients
    try {
      await this.sendMulticastNotification(
        notification.userIds,
        notification.title,
        notification.message,
        {
          type: notification.action?.type || 'general',
          id: notification.action?.id || '',
          notificationId: newNotification._id.toString(),
        }
      );
    } catch (error) {
      console.error('Error sending push notification:', error);
    }

    return newNotification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userIds: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async markNotificationAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    return this.notificationModel.findByIdAndUpdate(
      notificationId,
      {
        $set: { [`readBy.${userId}`]: true },
      },
      { new: true }
    );
  }

  async registerDeviceToken(
    userId: string,
    token: string,
    deviceId: string
  ): Promise<DeviceToken> {
    const existingToken = await this.deviceTokenModel.findOne({
      userId,
      deviceId,
    });

    if (existingToken) {
      existingToken.token = token;
      existingToken.lastUsed = new Date();
      return existingToken.save();
    }

    const deviceToken = new this.deviceTokenModel({
      userId,
      token,
      deviceId,
      lastUsed: new Date(),
    });

    return deviceToken.save();
  }

  async removeDeviceToken(userId: string, deviceId: string): Promise<void> {
    await this.deviceTokenModel.deleteOne({ userId, deviceId });
  }

  private async getUserExpoPushToken(userId: string): Promise<string[]> {
    const devices = await this.deviceTokenModel
      .find({ userId })
      .sort({ lastUsed: -1 })
      .exec();
    return devices.map((device) => device.token);
  }

  private async getUsersExpoPushTokens(userIds: string[]): Promise<string[]> {
    const devices = await this.deviceTokenModel
      .find({ userId: { $in: userIds } })
      .sort({ lastUsed: -1 })
      .exec();
    return devices.map((device) => device.token);
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    const pushTokens = await this.getUserExpoPushToken(userId);
    if (!pushTokens.length) return;

    try {
      const messages = pushTokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendMulticastNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    const tokens = await this.getUsersExpoPushTokens(userIds);
    if (!tokens.length) return;

    try {
      // Send notifications in batches of 100 to avoid hitting rate limits
      const batchSize = 100;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const messages = batch.map((token) => ({
          to: token,
          sound: 'default',
          title,
          body,
          data: data || {},
        }));

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(messages),
        });
      }
    } catch (error) {
      console.error('Error sending multicast notification:', error);
    }
  }
}
