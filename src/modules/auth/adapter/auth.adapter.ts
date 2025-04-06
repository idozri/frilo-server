import { User } from 'src/modules/users/entities/user.entity';
import { AppUser } from '../types/app.user';

export class AuthAdapter {
  mapUserToAppUser(user: User): AppUser {
    const userResponse: AppUser = {
      id: user._id.toString(),
      name: user.name,
      agreedToTerms: user.hasAcceptedSafetyGuidelines,
      avatarUrl: user.avatarUrl,
      points: user.points,
      email: user.email,
      isPhoneVerified: user.isPhoneVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      friendIds: user.friendIds,
      isOnline: user.isOnline,
      isActive: user.isActive,
      lastSeen: user.lastSeen,
      phoneNumber: user.phoneNumber,
      hasAcceptedSafetyGuidelines: user.hasAcceptedSafetyGuidelines,
      achievements: user.achievements || [],
      badges: user.badges || [],
    };

    return userResponse;
  }
}
