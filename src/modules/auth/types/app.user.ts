import {
  UserAchievement,
  UserBadge,
} from 'src/modules/achievements/entities/achievement.entity';
import { User } from 'src/modules/users/entities/user.entity';

export interface AppUser
  extends Omit<User, '_id' | 'achievementIds' | 'badgeIds'> {
  id: string;
  achievements: UserAchievement[];
  badges: UserBadge[];
}
