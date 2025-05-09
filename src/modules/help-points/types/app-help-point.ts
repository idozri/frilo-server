import {
  Achievement,
  UserAchievement,
} from '../../achievements/entities/achievement.entity';

export interface AppLocation {
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
}

interface SimpleUser {
  id: string;
  name: string;
}

interface SimpleCategory {
  _id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  type: string;
  helpPointsCount: number;
}

export interface AppHelpPoint {
  id: string;
  title: string;
  description: string;
  category: SimpleCategory;
  owner: SimpleUser;
  priority: string;
  status: string;
  participants: Array<{
    userId: string;
    status: string;
    joinedAt: string;
  }>;
  images: string[];
  location: AppLocation;
  rating: number;
  reviewCount: number;
  visitCount: number;
  isFavorited: boolean;
  isActive: boolean;
  verified: boolean;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HelpPointResponse extends AppHelpPoint {
  completedAchievements?: Achievement[];
  newAchievements?: UserAchievement[];
}
