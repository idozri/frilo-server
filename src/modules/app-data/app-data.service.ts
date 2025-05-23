/** @format */

import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AchievementsService } from '../achievements/achievements.service';
import { HelpPointsService } from '../help-points/help-points.service';
import { CategoriesService } from '../categories/categories.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatsService } from '../chats/chats.service';
import { User } from '../users/entities/user.entity';
import {
  Achievement,
  UserAchievement,
} from '../achievements/entities/achievement.entity';
import { AchievementSummaryItem } from '../achievements/types/achievement.types';
import { Category } from '../categories/entities/category.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AppHelpPoint } from '../help-points/types/app-help-point';

interface LocationParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface InitialAppData {
  achievements: {
    list: Achievement[];
    userAchievements: UserAchievement[];
    summary: AchievementSummaryItem[];
  };

  markers: {
    all: AppHelpPoint[];
    userMarkers: AppHelpPoint[];
  };
  categories: Category[];
  notifications: Notification[];
}

@Injectable()
export class AppDataService {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly helpPointService: HelpPointsService,
    private readonly categoriesService: CategoriesService,
    private readonly notificationsService: NotificationsService,
    private readonly chatsService: ChatsService
  ) {}

  async getInitialData(userId: string): Promise<InitialAppData> {
    try {
      const [
        achievements,
        userAchievements,
        achievementsSummary,
        allMarkers,
        userMarkers,
        categories,
        notifications,
      ] = await Promise.all([
        this.achievementsService.getAchievements(),
        this.achievementsService.getUserAchievements(userId),
        this.achievementsService.getUserAchievementsSummary(userId),
        this.helpPointService.findAll(),
        this.helpPointService.getUserHelpPoints(userId),
        this.categoriesService.findAll(),
        this.notificationsService.getNotifications(userId),
      ]);

      return {
        achievements: {
          list: achievements,
          userAchievements,
          summary: achievementsSummary,
        },
        categories,
        markers: {
          all: allMarkers,
          userMarkers,
        },
        notifications,
      };
    } catch (error) {
      console.error('Error fetching initial data:', error);
      throw new Error('Failed to fetch initial data');
    }
  }
}
