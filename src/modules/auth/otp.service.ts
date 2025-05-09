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
import { normalizePhoneNumber } from 'src/utils/phone.utils';
import getRemainingTime from 'src/utils/get.remaining.time.utils';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import {
  OTP_ERROR_CODES,
  OTP_ERROR_MESSAGES,
} from './constants/auth.error.codes';

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

  async sendOtp({ phoneNumber }: RequestOtpDto): Promise<ApiResponse<{}>> {
    console.log('Sending OTP to:', phoneNumber);

    try {
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

      const existingOtp = await this.otpModel.findOne({
        phoneNumber: normalizedPhoneNumber,
      });

      if (existingOtp?.blockedUntil && existingOtp.blockedUntil > new Date()) {
        return {
          isSuccess: false,
          errorCode: OTP_ERROR_CODES.OTP_BLOCKED,
          message: `${OTP_ERROR_MESSAGES.OTP_BLOCKED} ${getRemainingTime(existingOtp.blockedUntil)} דקות`,
        };
      }

      const otp = this.generateOtp();
      const twilioPhoneNumber = this.configService.get<string>(
        'TWILIO_PHONE_NUMBER'
      );

      // Delete any existing OTPs for this phone number
      await this.otpModel.deleteMany({
        phoneNumber: normalizedPhoneNumber,
      });

      // Create new OTP
      await this.otpModel.create({
        phoneNumber: normalizedPhoneNumber,
        code: otp,
      });

      // In development, return the OTP for testing
      if (this.configService.get('NODE_ENV') === 'development') {
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
      throw new BadRequestException(error.message);
    }
  }

  async verifyOtp({
    phoneNumber,
    otp,
  }: VerifyOtpDto): Promise<ApiResponse<{}>> {
    console.log('Verifying OTP:', phoneNumber, otp);

    // Find the latest valid OTP for this phone number
    const otpRecord = await this.otpModel
      .findOne({
        phoneNumber: normalizePhoneNumber(phoneNumber),
      })
      .sort({ createdAt: -1 });

    if (!otpRecord) throw new BadRequestException('קוד אימות לא נמצא');
    if (otpRecord.expiresAt < new Date())
      throw new BadRequestException('קוד אימות פג תוקף');
    if (otpRecord.attempts >= 5) {
      return {
        isSuccess: false,
        errorCode: OTP_ERROR_CODES.OTP_BLOCKED,
        message: `${OTP_ERROR_MESSAGES.OTP_BLOCKED} ${getRemainingTime(otpRecord.blockedUntil)} דקות`,
      };
    }

    // In development, always verify
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log('Development OTP verified');
      return { isSuccess: true };
    }

    if (otpRecord.code !== otp) {
      // ⛔ Increment attempts on failure
      otpRecord.attempts += 1;

      if (otpRecord.attempts >= 5) {
        otpRecord.blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // block for 15 minutes
      }

      await otpRecord.save();
      return {
        isSuccess: false,
        errorCode: OTP_ERROR_CODES.OTP_INVALID,
        message: OTP_ERROR_MESSAGES.OTP_INVALID,
      };
    }

    otpRecord.isVerifiedOTP = true;
    try {
      await otpRecord.save();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new BadRequestException('שגיאה בתהליך אימות קוד אימות');
    }

    return { isSuccess: true };
  }

  async isPhoneNumberVerified(phoneNumber: string): Promise<boolean> {
    const otpRecord = await this.otpModel.findOne({
      phoneNumber: normalizePhoneNumber(phoneNumber),
    });

    return otpRecord?.isVerifiedOTP || false;
  }

  async removePhoneNumber(phoneNumber: string): Promise<void> {
    try {
      // Delete all OTPs for this phone number
      await this.otpModel.deleteMany({
        phoneNumber: normalizePhoneNumber(phoneNumber),
      });
    } catch (error) {
      console.error('Error removing OTP:', error);
      throw new BadRequestException('שגיאה במחיקת קוד אימות');
    }
  }
}
