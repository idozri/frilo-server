/** @format */

import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { OnboardingService } from './onboarding.service';
import {
  PhoneVerificationRequestDto,
  PhoneVerificationConfirmDto,
  UpdateOnboardingProgressDto,
  AcceptSafetyGuidelinesDto,
} from './dto/onboarding.dto';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('phone/request-verification')
  @ApiOperation({ summary: 'Request phone number verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Phone already verified' })
  requestPhoneVerification(
    @User('id') userId: string,
    @Body() dto: PhoneVerificationRequestDto
  ) {
    return this.onboardingService.requestPhoneVerification(userId, dto);
  }

  @Post('phone/confirm-verification')
  @ApiOperation({ summary: 'Confirm phone number with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Phone number verified successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  confirmPhoneVerification(
    @User('id') userId: string,
    @Body() dto: PhoneVerificationConfirmDto
  ) {
    return this.onboardingService.confirmPhoneVerification(userId, dto);
  }

  @Post('progress')
  @ApiOperation({ summary: 'Update onboarding progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  updateOnboardingProgress(
    @User('id') userId: string,
    @Body() dto: UpdateOnboardingProgressDto
  ) {
    return this.onboardingService.updateOnboardingProgress(userId, dto);
  }

  @Post('safety-guidelines')
  @ApiOperation({ summary: 'Accept safety guidelines' })
  @ApiResponse({ status: 200, description: 'Safety guidelines accepted' })
  @ApiResponse({ status: 400, description: 'Guidelines must be accepted' })
  acceptSafetyGuidelines(
    @User('id') userId: string,
    @Body() dto: AcceptSafetyGuidelinesDto
  ) {
    return this.onboardingService.acceptSafetyGuidelines(userId, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status' })
  @ApiResponse({ status: 200, description: 'Returns onboarding status' })
  getOnboardingStatus(@User('id') userId: string) {
    return this.onboardingService.getOnboardingStatus(userId);
  }
}
