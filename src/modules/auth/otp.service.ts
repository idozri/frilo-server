/** @format */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Twilio } from 'twilio';
import { UsersService } from '../users/users.service';
import { RequestOtpDto, VerifyOtpDto } from './dto';
import { User } from '../users/entities/user.entity';
import { Otp, OtpDocument } from './entities/otp.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OtpService {
  // private twilioClient: Twilio;
  private readonly JWT_SECRET = this.configService.get('JWT_SECRET');

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    // this.twilioClient = new Twilio(accountSid, authToken);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp({
    phoneNumber,
  }: RequestOtpDto): Promise<{ isSuccess: boolean }> {
    console.log('Sending OTP to:', phoneNumber);

    try {
      const otp = this.generateOtp();
      const twilioPhoneNumber = this.configService.get<string>(
        'TWILIO_PHONE_NUMBER'
      );

      // Create new OTP record
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

      // Delete any existing OTPs for this phone number
      await this.otpModel.deleteMany({ phoneNumber });

      // Create new OTP
      await this.otpModel.create({
        phoneNumber,
        code: otp,
        expiresAt,
        attempts: 0,
      });

      // In development, return the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Development OTP:', otp);
        return { isSuccess: true };
      }

      // Send OTP via Twilio in production
      // await this.twilioClient.messages.create({
      //   body: `Your Frilo verification code is: ${otp}. Valid for 5 minutes.`,
      //   from: twilioPhoneNumber,
      //   to: phoneNumber,
      // });

      return { isSuccess: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  async verifyOtp({ phoneNumber, otp }: VerifyOtpDto): Promise<{
    isSuccess: boolean;
    isUserExists?: boolean;
    token?: string;
    user?: User;
  }> {
    console.log('Verifying OTP:', phoneNumber, otp);

    // Find the latest valid OTP for this phone number
    const otpRecord = await this.otpModel
      .findOne({
        phoneNumber,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      return { isSuccess: false };
    }

    // In development, always verify
    if (this.configService.get('NODE_ENV') === 'development') {
      await this.otpModel.findByIdAndDelete(otpRecord._id);
      return { isSuccess: true };
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Check if max attempts exceeded (e.g., 3 attempts)
    if (otpRecord.attempts >= 3) {
      await this.otpModel.findByIdAndDelete(otpRecord._id);
      return { isSuccess: false };
    }

    // Verify OTP
    const isValid = otpRecord.code === otp;
    if (isValid) {
      await this.otpModel.findByIdAndDelete(otpRecord._id);
    }

    return { isSuccess: isValid };
  }

  async isPhoneNumberVerified(phoneNumber: string): Promise<boolean> {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    return user?.isPhoneVerified || false;
  }

  async removePhoneNumber(phoneNumber: string): Promise<void> {
    // Delete all OTPs for this phone number
    await this.otpModel.deleteMany({ phoneNumber });
  }
}
