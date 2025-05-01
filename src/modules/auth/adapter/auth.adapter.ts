import { User, UserDocument } from 'src/modules/users/entities/user.entity';
import { AppUserDto } from '../dto/app-user.dto';

export class AuthAdapter {
  mapUserToAppUser(user: UserDocument): AppUserDto {
    const userObject = user.toObject({ virtuals: true });

    const userResponse: AppUserDto = new AppUserDto({
      id: userObject._id.toString(),
      name: userObject.name,
      bio: userObject.bio,
      agreedToTerms: userObject.agreedToTerms,
      avatarUrl: userObject.avatarUrl,
      points: userObject.points,
      email: userObject.email,
      isPhoneVerified: userObject.isPhoneVerified,
      friendIds: userObject.friendIds || [],
      isOnline: userObject.isOnline,
      isActive: userObject.isActive,
      lastSeen: userObject.lastSeen,
      phoneNumber: userObject.phoneNumber,
      hasAcceptedSafetyGuidelines: userObject.hasAcceptedSafetyGuidelines,
      achievements: userObject.achievements || [],
      badges: userObject.badges || [],
      skills: userObject.skills || [],
      completedRequests: userObject.completedRequests,
      verificationStatus: userObject.verificationStatus,
      language: userObject.language,
    });

    return userResponse;
  }
}
