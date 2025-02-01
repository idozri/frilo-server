/** @format */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Achievement, UserAchievement } from './entities/achievement.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(Achievement.name)
    private achievementModel: Model<Achievement>,
    @InjectModel(UserAchievement.name)
    private userAchievementModel: Model<UserAchievement>
  ) {}

  async getAchievements(): Promise<Achievement[]> {
    return this.achievementModel.find({ isHidden: false }).exec();
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievementModel.find({ userId }).exec();
  }

  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number
  ): Promise<UserAchievement> {
    const achievement = await this.achievementModel.findById(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    let userAchievement = await this.userAchievementModel.findOne({
      userId,
      achievementId,
    });

    if (!userAchievement) {
      userAchievement = new this.userAchievementModel({
        userId,
        achievementId,
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
    // Implement progress calculation based on achievement type and criteria
    switch (achievement.type) {
      case 'MARKERS_CREATED':
        // Count user's created markers
        return 0;
      case 'MARKERS_COMPLETED':
        // Count user's completed markers
        return 0;
      case 'MESSAGES_SENT':
        // Count user's sent messages
        return 0;
      case 'REACTIONS_RECEIVED':
        // Count reactions received on user's messages
        return 0;
      case 'HELP_PROVIDED':
        // Count times user helped others
        return 0;
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
      }
      if (achievement.rewards.unlockFeature) {
        // Unlock feature
      }
    }
  }
}
