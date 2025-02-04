/** @format */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { auth } from 'firebase-admin';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(user: any) {
    console.log('Creating JWT for user:', user);
    const token = this.jwtService.sign({
      userId: user._id,
      email: user.email,
    });
    console.log('Generated token payload:', this.jwtService.decode(token));
    return {
      access_token: token,
    };
  }

  async loginWithFirebase(loginData: FirebaseAuthDto) {
    try {
      // Verify Firebase token
      const decodedToken = await auth().verifyIdToken(loginData.firebaseToken);

      // Ensure the token matches the user
      if (decodedToken.uid !== loginData.userId) {
        throw new Error('Invalid token');
      }

      // Create or update user
      const user = await this.usersService.findOrCreate({
        id: loginData.userId,
        email: loginData.email,
        displayName: loginData.displayName,
      });

      // Generate JWT
      const token = this.jwtService.sign({
        userId: user._id || user.id,
        email: user.email,
      });

      return { token, user };
    } catch (error) {
      console.error('Firebase auth failed:', error);
      throw new Error('Authentication failed');
    }
  }

  async sendOtp(phoneNumber: string) {
    const success = await this.otpService.sendOtp(phoneNumber);
    if (!success) {
      throw new BadRequestException('Failed to send OTP');
    }
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    const isValid = this.otpService.verifyOtp(phoneNumber, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Create or update user with verified phone number
    const user = await this.usersService.findOrCreateByPhone(phoneNumber);

    // Generate JWT token
    const token = this.jwtService.sign({
      userId: user._id,
      phoneNumber: user.phoneNumber,
    });

    return {
      message: 'OTP verified successfully',
      token,
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    if (!registerDto.agreedToTerms) {
      throw new BadRequestException('User must agree to terms');
    }

    // Check if phone number is verified
    const isVerified = this.otpService.isPhoneNumberVerified(
      registerDto.phoneNumber
    );

    if (!isVerified) {
      throw new UnauthorizedException('Phone number must be verified first');
    }

    // Find or create user
    const user = await this.usersService.findOrCreateByPhone(
      registerDto.phoneNumber,
      {
        name: registerDto.name,
        agreedToTerms: registerDto.agreedToTerms,
      }
    );

    // Generate JWT token
    const token = this.jwtService.sign({
      userId: user._id,
      phoneNumber: user.phoneNumber,
    });

    this.otpService.removePhoneNumber(registerDto.phoneNumber);

    return {
      isSuccess: true,
      token,
      user,
    };
  }
}
