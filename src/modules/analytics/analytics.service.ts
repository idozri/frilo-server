/** @format */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HelpPoint,
  HelpPointStatus,
} from '../help-points/entities/help-point.entity';
import { User } from '../users/entities/user.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Message } from '../chats/entities/message.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(HelpPoint.name) private markerModel: Model<HelpPoint>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(Message.name) private messageModel: Model<Message>
  ) {}

  async getUserStats() {
    const totalUsers = await this.userModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments({ isOnline: true });
    const newUsers = await this.userModel.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    return { totalUsers, activeUsers, newUsers };
  }

  async getMarkerStats() {
    const totalMarkers = await this.markerModel.countDocuments();
    const activeMarkers = await this.markerModel.countDocuments({
      status: 'Active',
    });
    const completedMarkers = await this.markerModel.countDocuments({
      status: 'Completed',
    });

    return { totalMarkers, activeMarkers, completedMarkers };
  }

  async getChatStats() {
    const totalChats = await this.chatModel.countDocuments();
    const totalMessages = await this.messageModel.countDocuments();
    const activeChats = await this.chatModel.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    return { totalChats, totalMessages, activeChats };
  }

  async getUserActivity(userId: string) {
    const markers = await this.markerModel.countDocuments({ ownerId: userId });
    const participations = await this.markerModel.countDocuments({
      'participants.userId': userId,
    });
    const messages = await this.messageModel.countDocuments({
      senderId: userId,
    });

    return { markers, participations, messages };
  }

  async getPopularCategories() {
    return this.markerModel.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
  }

  async getHourlyActivity() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.messageModel.aggregate([
      { $match: { createdAt: { $gte: last24Hours } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getMarkerCompletionRate() {
    const total = await this.markerModel.countDocuments();
    const completed = await this.markerModel.countDocuments({
      status: HelpPointStatus.COMPLETED,
    });
    return total ? (completed / total) * 100 : 0;
  }

  async getAverageResponseTime() {
    // Calculate average time between marker creation and first participant
    const markers = await this.markerModel
      .find({ 'participants.0': { $exists: true } })
      .select('createdAt participants')
      .exec();

    if (!markers.length) return 0;

    const totalTime = markers.reduce((sum, marker) => {
      const firstParticipantTime = new Date(
        marker.participants[0].joinedAt
      ).getTime();
      const markerCreationTime = marker.createdAt.getTime();
      return sum + (firstParticipantTime - markerCreationTime);
    }, 0);

    return totalTime / markers.length;
  }
}
