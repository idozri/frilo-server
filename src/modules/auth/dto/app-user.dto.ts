/** @format */

import { Expose } from 'class-transformer';

// Define nested DTOs if they become complex, otherwise inline or use 'any' temporarily
// Example:
// export class VerificationStatusDto {
//   @Expose() emailVerified: boolean;
//   @Expose() phoneVerified: boolean;
//   @Expose() idVerified: boolean;
// }

export class AppUserDto {
  @Expose() id: string;
  @Expose() name?: string;
  @Expose() bio?: string;
  @Expose() agreedToTerms: boolean;
  @Expose() avatarUrl?: string;
  @Expose() points: number;
  @Expose() email?: string;
  @Expose() isPhoneVerified: boolean;
  @Expose() friendIds: string[];
  @Expose() isOnline: boolean;
  @Expose() isActive: boolean;
  @Expose() lastSeen?: Date;
  @Expose() phoneNumber?: string;
  @Expose() hasAcceptedSafetyGuidelines: boolean;
  @Expose() achievements: any[]; // Use specific DTO array like AchievementDto[] if defined
  @Expose() badges: any[]; // Use specific DTO array like BadgeDto[] if defined
  @Expose() skills: string[];
  @Expose() completedRequests: number;
  @Expose() verificationStatus: any; // Use specific DTO like VerificationStatusDto if defined
  @Expose() language: 'en' | 'he';

  // Optional constructor for easier instantiation
  constructor(partial: Partial<AppUserDto>) {
    Object.assign(this, partial);
  }
}
