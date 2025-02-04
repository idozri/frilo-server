/** @format */

import { Achievement, UserAchievement } from '../entities/achievement.entity';

export class AchievementHelper {
  static calculateProgressPercentage(
    currentProgress: number,
    totalRequired: number
  ): number {
    return Math.min((currentProgress / totalRequired) * 100, 100);
  }

  static getNextAchievements(
    userAchievements: UserAchievement[],
    allAchievements: Achievement[]
  ): Achievement[] {
    const completedIds = new Set(
      userAchievements
        .filter((ua) => ua.isCompleted)
        .map((ua) => ua.achievementId.toString())
    );

    return allAchievements.filter(
      (achievement) => !completedIds.has(achievement._id.toString())
    );
  }

  static sortAchievementsByProgress(
    userAchievements: UserAchievement[]
  ): UserAchievement[] {
    return [...userAchievements].sort((a, b) => {
      // Sort completed achievements to the end
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;

      // Sort by progress percentage for incomplete achievements
      if (!a.isCompleted && !b.isCompleted) {
        return b.progress - a.progress;
      }

      // Sort completed achievements by completion date
      return (
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    });
  }

  static groupAchievementsByType(
    achievements: Achievement[]
  ): Record<string, Achievement[]> {
    return achievements.reduce((groups, achievement) => {
      const type = achievement.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(achievement);
      return groups;
    }, {});
  }
}
