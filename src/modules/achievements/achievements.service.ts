/** @format */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Achievement,
  Badge,
  UserAchievement,
  UserBadge,
} from './entities/achievement.entity';
import {
  AchievementType,
  AchievementSummaryItem,
} from './types/achievement.types';
import { Message } from '../chats/entities/message.entity';
import { HelpPoint } from '../help-points/entities/help-point.entity';
import { MongoUtils } from 'src/utils/mongodb.utils';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(Achievement.name)
    private achievementModel: Model<Achievement>,
    @InjectModel(UserAchievement.name)
    private userAchievementModel: Model<UserAchievement>,
    @InjectModel(UserBadge.name)
    private userBadgeModel: Model<UserBadge>,
    @InjectModel(HelpPoint.name)
    private markersModel: Model<HelpPoint>,
    @InjectModel(Message.name)
    private messagesModel: Model<Message>,
    @InjectModel(User.name)
    private userModel: Model<User>
  ) {}

  async getAchievements(): Promise<Achievement[]> {
    return this.achievementModel.find({ isHidden: false }).exec();
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    console.log('Getting achievements for userId:', userId);
    const userAchievements = await this.userAchievementModel
      .find({ userId: MongoUtils.toObjectId(userId) })
      .populate({
        path: 'achievement',
        model: 'Achievement',
      })
      .lean()
      .exec();

    return userAchievements;
  }

  async getUserAchievementsSummary(
    userId: string
  ): Promise<AchievementSummaryItem[]> {
    const [completedAchievements, inProgressAchievement, badges] =
      await Promise.all([
        // Get latest 3 completed achievements
        this.userAchievementModel
          .find({ userId, isCompleted: true })
          .sort({ completedAt: -1 })
          .limit(3)
          .populate('achievement')
          .lean()
          .exec(),

        // Get top in-progress achievement
        this.userAchievementModel
          .findOne({ userId, isCompleted: false })
          .sort({ progress: -1 })
          .populate('achievement')
          .lean()
          .exec(),

        this.userBadgeModel
          .find({ userId })
          .sort({ earnedAt: -1 })
          .limit(3)
          .populate('badgeId')
          .lean()
          .exec(),
      ]);

    const badgesCount = await this.userAchievementModel.countDocuments({
      userId,
      isCompleted: true,
    });

    const latestBadges = badges.map((badge) => ({
      icon: badge.badge?.icon,
      color: badge.badge?.color,
      name: badge.badge?.name,
    }));

    const summary: AchievementSummaryItem[] = [
      {
        title: 'Badges Earned',
        value: badgesCount,
        icon: 'ribbon',
        color: '#10B981',
        latestBadges,
      },
    ];

    if (inProgressAchievement) {
      summary.push({
        title: inProgressAchievement.achievement?.name,
        value: Math.round(inProgressAchievement.progress * 100),
        icon: inProgressAchievement.achievement?.icon,
        color: inProgressAchievement.achievement?.color,
        progress: inProgressAchievement.progress,
        description: inProgressAchievement.achievement?.description,
      });
    }

    return summary;
  }

  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<UserAchievement> {
    let achievement;

    // Try to find achievement by code first
    achievement = await this.achievementModel.findOne({ code: achievementId });

    // If not found by code, try by ObjectId
    if (!achievement) {
      try {
        achievement = await this.achievementModel.findById(
          new Types.ObjectId(achievementId)
        );
      } catch (error) {
        throw new Error('Invalid achievement ID or code');
      }
    }

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    let userAchievement = await this.userAchievementModel.findOne({
      userId,
      achievementId: achievement._id,
    });

    if (!userAchievement) {
      userAchievement = new this.userAchievementModel({
        name: achievement.name,
        userId: MongoUtils.toObjectId(userId),
        achievementId: achievement._id,
        progress: 0,
        isCompleted: false,
      });
    }

    userAchievement.progress = progress;
    if (progress >= achievement.total && !userAchievement.isCompleted) {
      userAchievement.isCompleted = true;
      userAchievement.completedAt = new Date();
      // Trigger any achievement completion rewards here
      await this.handleAchievementCompletion(userId, achievement);
    }

    return userAchievement.save();
  }

  async checkAchievementProgress(userId: string): Promise<void> {
    const achievements = await this.achievementModel.find().exec();

    for (const achievement of achievements) {
      const progress = await this.calculateProgress(userId, achievement);
      if (progress > 0) {
        await this.updateAchievementProgress(
          userId,
          achievement._id.toString(),
          progress
        );
      }
    }
  }

  private async calculateProgress(
    userId: string,
    achievement: Achievement
  ): Promise<number> {
    switch (achievement.type) {
      case AchievementType.MARKERS_CREATED:
        const markersCount = await this.markersModel.countDocuments({
          ownerId: userId,
        });
        return markersCount;

      case AchievementType.MARKERS_COMPLETED:
        const completedMarkersCount = await this.markersModel.countDocuments({
          ownerId: userId,
          isCompleted: true,
        });
        return completedMarkersCount;

      case AchievementType.MESSAGES_SENT:
        const messagesSentCount = await this.messagesModel.countDocuments({
          senderId: userId,
        });
        return messagesSentCount;

      case AchievementType.REACTIONS_RECEIVED:
        const reactionsCount = await this.messagesModel.aggregate([
          { $match: { senderId: userId } },
          { $project: { reactionCount: { $size: '$reactions' } } },
          { $group: { _id: null, total: { $sum: '$reactionCount' } } },
        ]);
        return reactionsCount[0]?.total || 0;

      case AchievementType.HELP_PROVIDED:
        const helpProvidedCount = await this.markersModel.countDocuments({
          helpProvidedBy: userId,
        });
        return helpProvidedCount;

      default:
        return 0;
    }
  }

  private async handleAchievementCompletion(
    userId: string,
    achievement: Achievement
  ): Promise<void> {
    if (achievement.rewards) {
      // Handle rewards based on type
      if (achievement.rewards.badge) {
        // Award badge
      }
      if (achievement.rewards.points) {
        // Award points
        await this.userModel.updateOne(
          {
            _id: MongoUtils.toObjectId(userId),
          },
          { $inc: { points: achievement.rewards.points } }
        );
      }
      if (achievement.rewards.unlockFeature) {
        // Unlock feature
      }
    }
  }

  async checkAchievementsByType(
    userId: string,
    type: AchievementType
  ): Promise<{
    completedAchievements: Achievement[];
    newAchievements: UserAchievement[];
  }> {
    // Get all achievements of the specified type
    const achievements = await this.achievementModel.find({ type });
    const completedAchievements: Achievement[] = [];

    const newAchievements: UserAchievement[] = [];
    for (const achievement of achievements) {
      const progress = await this.calculateProgress(userId, achievement);

      // Check if this achievement was already completed
      const existingUserAchievement = await this.userAchievementModel.findOne({
        userId: MongoUtils.toObjectId(userId),
        achievementId: achievement._id,
      });

      if (!existingUserAchievement) {
        // Create new user achievement
        const userAchievement = new this.userAchievementModel({
          name: achievement.name,
          userId: MongoUtils.toObjectId(userId),
          achievementId: achievement._id,
          progress,
          isCompleted: progress >= achievement.total,
          completedAt: progress >= achievement.total ? new Date() : undefined,
        });
        await userAchievement.save();

        if (progress >= achievement.total) {
          await this.handleAchievementCompletion(userId, achievement);
          completedAchievements.push(achievement);
        } else {
          newAchievements.push(userAchievement);
        }
      } else if (!existingUserAchievement.isCompleted) {
        // Update progress for existing incomplete achievement
        existingUserAchievement.progress = progress;

        if (progress >= achievement.total) {
          existingUserAchievement.isCompleted = true;
          existingUserAchievement.completedAt = new Date();
          await this.handleAchievementCompletion(userId, achievement);
          completedAchievements.push(achievement);
        }

        await existingUserAchievement.save();
      }
    }

    return { completedAchievements, newAchievements };
  }
}
