/** @format */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class OtpService {
  // private twilioClient: Twilio;
  private verifiedPhones: Set<string> = new Set();

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    // this.twilioClient = new Twilio(accountSid, authToken);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // In a production environment, you should store OTPs securely with expiration
  private otpStore: Map<string, { otp: string; timestamp: number }> = new Map();

  async sendOtp(phoneNumber: string): Promise<{ isOtpSent: boolean }> {
    try {
      const otp = this.generateOtp();
      const twilioPhoneNumber = this.configService.get<string>(
        'TWILIO_PHONE_NUMBER'
      );

      // Store OTP with 5-minute expiration
      this.otpStore.set(phoneNumber, {
        otp,
        timestamp: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
      });

      // Send OTP via Twilio
      // await this.twilioClient.messages.create({
      //   body: `Your Frilo verification code is: ${otp}. Valid for 5 minutes.`,
      //   from: twilioPhoneNumber,
      //   to: phoneNumber,
      // });
      console.log('OTP sent:', otp);
      return { isOtpSent: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { isOtpSent: false };
    }
  }

  verifyOtp(phoneNumber: string, otp: string): { isValid: boolean } {
    console.log('Verifying OTP:', phoneNumber, otp);
    const storedData = this.otpStore.get(phoneNumber);
    console.log('Stored data:', storedData);
    if (!storedData) {
      console.log('No stored data found');
      return { isValid: false };
    }

    const isValid = storedData.otp === otp && Date.now() < storedData.timestamp;
    console.log('Is valid:', isValid);
    if (isValid) {
      // Clean up the used OTP
      this.otpStore.delete(phoneNumber);
      // Mark phone number as verified
      this.verifiedPhones.add(phoneNumber);
    }

    return { isValid };
  }

  isPhoneNumberVerified(phoneNumber: string): boolean {
    return this.verifiedPhones.has(phoneNumber);
  }

  removePhoneNumber(phoneNumber: string): void {
    this.verifiedPhones.delete(phoneNumber);
  }
}
