/** @format */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Notification } from './entities/notification.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private app: admin.app.App;

  constructor(
    private configService: ConfigService,
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>
  ) {}

  async onModuleInit() {
    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT'
    );

    // Read the JSON file
    const serviceAccount = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), serviceAccountPath), 'utf8')
    );

    // Initialize Firebase Admin
    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    const user = await this.getUserFCMToken(userId);
    if (!user?.fcmToken) return;

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data,
      token: user.fcmToken,
    };

    try {
      await admin.messaging().send(message);
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
    const users = await this.getUsersFCMTokens(userIds);
    const tokens = users
      .filter((user) => user.fcmToken)
      .map((user) => user.fcmToken);

    if (!tokens.length) return;

    try {
      // Send notifications in batches of 500 (Firebase limit)
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const messages = batch.map((token) => ({
          notification: {
            title,
            body,
          },
          data,
          token,
        }));

        await admin.messaging().sendEach(messages);
      }
    } catch (error) {
      console.error('Error sending multicast notification:', error);
    }
  }

  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId,
      title,
      body,
      type,
      data,
      isRead: false,
    });

    return notification.save();
  }

  async markAsRead(
    userId: string,
    notificationId: string
  ): Promise<Notification> {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async getUserFCMToken(userId: string) {
    // Implement this method to get user's FCM token from your database
    return null;
  }

  private async getUsersFCMTokens(userIds: string[]) {
    // Implement this method to get multiple users' FCM tokens from your database
    return [];
  }
}
