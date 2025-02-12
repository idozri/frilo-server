/** @format */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import {
  LoginDto,
  RegisterDto,
  VerifyUserDto,
  EmailLoginDto,
  GoogleAuthDto,
  ForgotPasswordRequestDto,
  ResetPasswordDto,
  RegisterWithPhoneDto,
} from './dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import { LoginVerifiedPhoneDto, LoginWithPhoneDto } from './dto';
import { AuthAdapter } from './adapter/auth.adapter';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = this.configService.get('JWT_SECRET');
  private readonly googleClient: OAuth2Client;
  private readonly emailTransporter: nodemailer.Transporter;
  private readonly passwordResetTokens = new Map<
    string,
    { email: string; expires: Date }
  >();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private authAdapter: AuthAdapter
  ) {
    // Initialize Google OAuth client
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID')
    );

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  // Login user
  async login(loginDto: LoginDto) {
    return true;
    // try {
    //   console.log('loginDto', loginDto);
    //   const user = await this.usersService.findByPhoneNumber(
    //     loginDto.phoneNumber
    //   );
    //   if (!user) {
    //     throw new UnauthorizedException('Invalid credentials');
    //   }
    //   if (!user.isPhoneVerified) {
    //     throw new UnauthorizedException('Phone number must be verified first');
    //   }
    //   // Generate JWT token
    //   const token = this.jwtService.sign(
    //     {
    //       userId: user._id,
    //       phoneNumber: user.phoneNumber,
    //     },
    //     { secret: this.JWT_SECRET }
    //   );
    //   return {
    //     isSuccess: true,
    //     token,
    //     user,
    //   };
    // } catch (error) {
    //   throw new UnauthorizedException('Invalid credentials');
    // }
  }

  async loginWithPhone(loginDto: LoginWithPhoneDto) {
    const user = await this.usersService.findByPhoneNumber(
      loginDto.phoneNumber
    );

    if (!user) {
      return {
        isSuccess: false,
        message: 'User not found',
      };
    }

    if (!user.isPhoneVerified) {
      return {
        isSuccess: false,
        message: 'Phone number must be verified first',
      };
    }

    return this.otpService.sendOtp({ phoneNumber: loginDto.phoneNumber });
  }

  async loginVerifiedPhone(loginDto: LoginVerifiedPhoneDto) {
    const user = await this.usersService.findByPhoneNumber(
      loginDto.phoneNumber
    );

    if (!user) {
      return {
        isSuccess: false,
        message: 'User not found',
      };
    }

    if (!user.isPhoneVerified) {
      return {
        isSuccess: false,
        message: 'Phone number must be verified first',
      };
    }

    const isVerified = await this.otpService.verifyOtp({
      phoneNumber: loginDto.phoneNumber,
      otp: loginDto.otp,
    });

    if (!isVerified.isSuccess) {
      return {
        isSuccess: false,
        message: 'Invalid OTP',
      };
    }

    const token = this.jwtService.sign(
      {
        userId: user._id,
        phoneNumber: user.phoneNumber,
      },
      { secret: this.JWT_SECRET }
    );

    return {
      isSuccess: true,
      token,
      user: this.authAdapter.mapUserToAppUser(user),
    };
  }

  // Register user
  async registerWithPhone(registerDto: RegisterWithPhoneDto) {
    const user = await this.usersService.findByPhoneNumber(
      registerDto.phoneNumber
    );

    if (user) {
      return {
        isSuccess: false,
        message: 'User already exists',
      };
    }

    return this.otpService.sendOtp({ phoneNumber: registerDto.phoneNumber });
  }

  async register(registerDto: RegisterDto) {
    console.log('registerDto', registerDto);
    if (!registerDto.agreedToTerms) {
      throw new BadRequestException('User must agree to terms');
    }

    // Find or create user
    const user = await this.usersService.findOrCreateByPhone(
      registerDto.phoneNumber,
      {
        name: registerDto.name,
        email: registerDto.email,
        agreedToTerms: registerDto.agreedToTerms,
      }
    );

    // Generate JWT token
    const token = this.jwtService.sign(
      {
        userId: user._id,
        phoneNumber: user.phoneNumber,
      },
      {
        secret: this.JWT_SECRET,
      }
    );

    return {
      isSuccess: true,
      token,
      user: this.authAdapter.mapUserToAppUser(user),
    };
  }

  async verifyUser(verifyUserDto: VerifyUserDto): Promise<any> {
    const { token, phoneNumber } = verifyUserDto;
    const user = await this.usersService.findByPhoneNumber(phoneNumber);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isPhoneVerified) {
      throw new UnauthorizedException('Phone number must be verified first');
    }

    if (token && this.jwtService.verify(token, { secret: this.JWT_SECRET })) {
      return {
        isSuccess: true,
        user: this.authAdapter.mapUserToAppUser(user),
        token,
      };
    }

    const newToken = this.jwtService.sign(
      {
        userId: user._id,
        phoneNumber: user.phoneNumber,
      },
      {
        secret: this.JWT_SECRET,
      }
    );

    return {
      isSuccess: true,
      token: newToken,
      user: this.authAdapter.mapUserToAppUser(user),
    };
  }

  // New method for email login
  async loginWithEmail(loginDto: EmailLoginDto) {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign(
        {
          userId: user._id,
          email: user.email,
        },
        { secret: this.JWT_SECRET }
      );

      return {
        isSuccess: true,
        token,
        user: this.authAdapter.mapUserToAppUser(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  // New method for Google authentication
  async loginWithGoogle(googleAuthDto: GoogleAuthDto) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleAuthDto.idToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      let user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        // Create new user if doesn't exist
        user = await this.usersService.findOrCreate({
          id: uuidv4(),
          email: payload.email,
          name: payload.name,
        });
      }

      const token = this.jwtService.sign(
        {
          userId: user._id,
          email: user.email,
        },
        { secret: this.JWT_SECRET }
      );

      return {
        isSuccess: true,
        token,
        user: this.authAdapter.mapUserToAppUser(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  // New method for requesting password reset
  async requestPasswordReset(forgotPasswordDto: ForgotPasswordRequestDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = uuidv4();
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1); // Token expires in 1 hour

    this.passwordResetTokens.set(resetToken, {
      email: user.email,
      expires: expiryTime,
    });

    // Send reset email
    await this.emailTransporter.sendMail({
      from: this.configService.get('EMAIL_USER'),
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
        <a href="${this.configService.get('CLIENT_URL')}/reset-password?token=${resetToken}">
          Reset Password
        </a>
      `,
    });

    return { message: 'Password reset email sent' };
  }

  // New method for resetting password
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const resetData = this.passwordResetTokens.get(resetPasswordDto.token);

    if (!resetData) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (new Date() > resetData.expires) {
      this.passwordResetTokens.delete(resetPasswordDto.token);
      throw new UnauthorizedException('Reset token has expired');
    }

    const user = await this.usersService.findByEmail(resetData.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.usersService.update(user.id, { password: hashedPassword });

    // Clean up used token
    this.passwordResetTokens.delete(resetPasswordDto.token);

    return { message: 'Password successfully reset' };
  }
}
