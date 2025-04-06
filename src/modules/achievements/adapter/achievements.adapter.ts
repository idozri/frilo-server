import { UserAchievement } from '../entities/achievement.entity';
import { Achievement } from '../entities/achievement.entity';

class AchievementsAdapter {
  mapUserAchievements(achievements: UserAchievement[]): UserAchievement[] {
    return achievements;
    // return achievements.map((achievement) => ({
    //   ...achievement,
    //   achievement: achievement.achievementId as Achievement,
    // }));
  }
}

export default AchievementsAdapter;
