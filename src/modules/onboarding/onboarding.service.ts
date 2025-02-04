/** @format */

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import {
  PhoneVerificationRequestDto,
  PhoneVerificationConfirmDto,
  UpdateOnboardingProgressDto,
  AcceptSafetyGuidelinesDto,
} from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  private otpStore: Map<string, { otp: string; expiresAt: Date }> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  async requestPhoneVerification(
    userId: string,
    dto: PhoneVerificationRequestDto
  ) {
    const user = await this.usersService.findOne(userId);
    if (user.isPhoneVerified) {
      throw new BadRequestException('Phone number already verified');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5-minute expiration
    this.otpStore.set(dto.phoneNumber, {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // TODO: Integrate with SMS service to send OTP
    // For now, we'll just return the OTP (in production, this should be removed)
    return { message: 'OTP sent successfully', otp };
  }

  async confirmPhoneVerification(
    userId: string,
    dto: PhoneVerificationConfirmDto
  ) {
    const storedOtp = this.otpStore.get(dto.phoneNumber);
    if (!storedOtp) {
      throw new BadRequestException('No OTP request found');
    }

    if (new Date() > storedOtp.expiresAt) {
      this.otpStore.delete(dto.phoneNumber);
      throw new BadRequestException('OTP expired');
    }

    if (storedOtp.otp !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear the OTP from storage
    this.otpStore.delete(dto.phoneNumber);

    // Update user's phone verification status
    const user = await this.usersService.findOne(userId);
    await this.usersService.update(userId, {
      phoneNumber: dto.phoneNumber,
      isPhoneVerified: true,
      onboardingProgress: {
        ...user.onboardingProgress,
        phoneVerified: true,
      },
    });

    return { message: 'Phone number verified successfully' };
  }

  async updateOnboardingProgress(
    userId: string,
    dto: UpdateOnboardingProgressDto
  ) {
    const user = await this.usersService.findOne(userId);
    const updatedProgress = {
      ...user.onboardingProgress,
      ...dto,
    };

    // Check if all onboarding steps are completed
    const isOnboardingCompleted = Object.values(updatedProgress).every(
      (value) => value === true
    );

    await this.usersService.update(userId, {
      onboardingProgress: updatedProgress,
      hasCompletedOnboarding: isOnboardingCompleted,
    });

    return {
      message: 'Onboarding progress updated successfully',
      isCompleted: isOnboardingCompleted,
    };
  }

  async acceptSafetyGuidelines(userId: string, dto: AcceptSafetyGuidelinesDto) {
    if (!dto.accepted) {
      throw new BadRequestException(
        'Safety guidelines must be accepted to continue'
      );
    }

    const user = await this.usersService.findOne(userId);
    await this.usersService.update(userId, {
      hasAcceptedSafetyGuidelines: true,
      onboardingProgress: {
        ...user.onboardingProgress,
        safetyGuidelinesAccepted: true,
      },
    });

    return { message: 'Safety guidelines accepted successfully' };
  }

  async getOnboardingStatus(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      isPhoneVerified: user.isPhoneVerified,
      hasAcceptedSafetyGuidelines: user.hasAcceptedSafetyGuidelines,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      onboardingProgress: user.onboardingProgress,
    };
  }
}
