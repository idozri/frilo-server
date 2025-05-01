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
  VerifyUserDto,
  EmailLoginDto,
  GoogleAuthDto,
  ForgotPasswordRequestDto,
  ResetPasswordDto,
  RegisterWithPhoneDto,
  RegisterUserDto,
  CheckUserExistsDto,
} from './dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import { LoginVerifiedPhoneDto, LoginWithPhoneDto } from './dto';
import { AuthAdapter } from './adapter/auth.adapter';
import { S3Service } from '../s3/s3.service';
import RegisterUserResponse from './interfaces/registerUserResponse';
import { GoogleProfile } from './interfaces/googleProfile.interface';
import { Response } from 'express';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = this.configService.get('JWT_SECRET');
  private readonly REFRESH_TOKEN_SECRET =
    this.configService.get('REFRESH_TOKEN_SECRET') || 'refresh-secret';
  private readonly redirectUrl = `${this.configService.get('CLIENT_URL')}/dashboard`;
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
    private authAdapter: AuthAdapter,
    private s3Service: S3Service
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

  private generateTokens(userId: string, phoneNumber: string) {
    const accessToken = this.jwtService.sign(
      {
        userId,
        phoneNumber,
      },
      {
        secret: this.JWT_SECRET,
        expiresIn: '15m', // Access token expires in 15 minutes
      }
    );

    const refreshToken = this.jwtService.sign(
      {
        userId,
        phoneNumber,
      },
      {
        secret: this.REFRESH_TOKEN_SECRET,
        expiresIn: '7d', // Refresh token expires in 7 days
      }
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.REFRESH_TOKEN_SECRET,
      });

      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user._id.toString(), user.phoneNumber);

      return {
        isSuccess: true,
        ...tokens,
        user: this.authAdapter.mapUserToAppUser(user as UserDocument),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Update the loginVerifiedPhone method to use the new token generation
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

    const tokens = this.generateTokens(user._id.toString(), user.phoneNumber);

    return {
      isSuccess: true,
      ...tokens,
      user: this.authAdapter.mapUserToAppUser(user as UserDocument),
    };
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

    console.log(user);

    if (!user.isPhoneVerified) {
      return {
        isSuccess: false,
        message: 'Phone number must be verified first',
      };
    }

    return this.otpService.sendOtp({ phoneNumber: loginDto.phoneNumber });
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

  async register(
    registerDto: RegisterUserDto,
    avatarFile?: Express.Multer.File,
    res?: Response
  ): Promise<RegisterUserResponse> {
    console.log('registerDto', registerDto);
    if (!registerDto.agreedToTerms) {
      throw new BadRequestException('User must agree to terms');
    }

    const { phoneNumber, email, googleId } = registerDto;

    // 1. Check for duplicate users
    if (phoneNumber) {
      const existingPhoneUser =
        await this.usersService.findByPhoneNumber(phoneNumber);
      if (existingPhoneUser) {
        throw new BadRequestException('Phone number already registered.');
      }
    }
    if (email) {
      const existingEmailUser = await this.usersService.findByEmail(email);
      if (existingEmailUser) {
        throw new BadRequestException('Email already registered.');
      }
    }
    if (googleId) {
      const existingGoogleUser =
        await this.usersService.findByGoogleId(googleId);
      if (existingGoogleUser) {
        throw new BadRequestException('Google account already registered.');
      }
    }

    // Upload avatar if provided
    let avatarUrl: string | null = null;
    if (avatarFile) {
      try {
        const uploadResult = await this.s3Service.uploadFile(
          avatarFile,
          'avatars'
        );
        avatarUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading avatar during registration:', error);
      }
    }

    console.log('avatarUrl', avatarUrl);
    // Find or create user
    const user = await this.usersService.create({
      phoneNumber: registerDto.phoneNumber,
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      bio: registerDto.bio,
      skills: registerDto.skills,
      agreedToTerms: registerDto.agreedToTerms,
      ...(avatarUrl && { avatarUrl }),
    });

    await this._generateAndSetAuthCookie(user, res);

    console.log('user', user);
    return {
      isSuccess: true,
      user: this.authAdapter.mapUserToAppUser(user as UserDocument),
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

    try {
      this.jwtService.verify(token, { secret: this.JWT_SECRET });
    } catch (err) {
      return {
        isSuccess: true,
        user: this.authAdapter.mapUserToAppUser(user as UserDocument),
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
      user: this.authAdapter.mapUserToAppUser(user as UserDocument),
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
        user: this.authAdapter.mapUserToAppUser(user as UserDocument),
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
        user: this.authAdapter.mapUserToAppUser(user as UserDocument),
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

  // Method to check user existence by email or phone
  async checkUserExists(checkDto: CheckUserExistsDto) {
    console.log('checkDto', checkDto);
    try {
      if (checkDto.method === 'email') {
        if (!checkDto.email) {
          throw new BadRequestException('Email is required for email check');
        }
        const user = await this.usersService.findByEmail(checkDto.email);
        if (user) {
          return {
            isSuccess: false,
            errorCode: 'ALREADY_EXISTS',
            message: 'User with this email already exists.',
          };
        }
      } else if (checkDto.method === 'phone') {
        if (!checkDto.phoneNumber) {
          throw new BadRequestException(
            'Phone number is required for phone check'
          );
        }
        const user = await this.usersService.findByPhoneNumber(
          checkDto.phoneNumber
        );
        if (user) {
          return {
            isSuccess: false,
            errorCode: 'ALREADY_EXISTS',
            message: 'User with this phone number already exists.',
          };
        }
      } else {
        // This case should theoretically not be reached due to DTO validation
        throw new BadRequestException('Invalid check method specified');
      }

      // If no user found with the given method/value
      return { isSuccess: true };
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error in checkUserExists:', error);

      // Re-throw specific known errors or a generic one
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Throw a generic server error for unexpected issues
      throw new BadRequestException('Failed to check user existence.');
    }
  }

  // --- Google OAuth Callback Handler ---

  /**
   * Handles the user data received from Google OAuth callback.
   * Finds or creates a user, generates JWT, sets HttpOnly cookie, and redirects.
   *
   * @param googleProfile - The profile information obtained from GoogleStrategy.
   * @param res - The Express Response object to set cookies and redirect.
   * @param state - Optional state object passed from the initial OAuth request.
   */
  async handleGoogleLogin(
    googleProfile: GoogleProfile,
    res: Response,
    state?: { flow?: string }
  ): Promise<void> {
    const { googleId, email, firstName, lastName, avatar } = googleProfile;

    if (!email) {
      console.error('Google profile missing email', googleProfile);
      return this._redirectWithError(res, 'google_email_missing', state);
    }

    // --- Registration Flow ---
    if (state?.flow === 'register') {
      console.log('Handling Google callback for REGISTRATION flow');
      // Don't create user yet. Redirect back to frontend with Google details.
      const registerUrl = `${this.configService.get('CLIENT_URL')}/auth?tab=register`;

      const queryParams = new URLSearchParams({
        step: '1', // Assuming Name step is step 1
        method: 'google',
        googleId: googleId,
        email: email,
        name:
          `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
        // Optionally pass avatar URL if you want to pre-fill it later
        ...(avatar && { avatar: avatar }),
      });

      // Clean URL, remove potential existing error param before appending new params
      const baseUrl = registerUrl.split('?')[0];
      const existingParams = new URLSearchParams(
        registerUrl.split('?')[1] || ''
      );
      existingParams.delete('error'); // Remove old errors

      // Combine existing base params (like tab=register) with new ones
      const finalParams = new URLSearchParams({
        ...Object.fromEntries(existingParams),
        ...Object.fromEntries(queryParams),
      });

      return res.redirect(`${baseUrl}?${finalParams.toString()}`);
    }

    // --- Standard Login Flow (if state.flow is not 'register') ---
    console.log('Handling Google callback for standard LOGIN flow');
    try {
      let user: User | null = null;

      // 1. Find user by Google ID
      user = await this.usersService.findByGoogleId(googleId);

      // 2. If not found by Google ID, find by email and link
      if (!user) {
        user = await this.usersService.findByEmail(email);
        if (user) {
          console.log(
            `Linking Google ID ${googleId} to existing user ${user._id} with email ${email}`
          );
          // Important: Ensure user.googleId allows null/undefined or handle potential conflict
          if (user.googleId && user.googleId !== googleId) {
            console.warn(
              `User ${email} already linked to a different Google ID.`
            );
            // Decide how to handle this: error out, or overwrite? Overwriting here.
          }
          user = await this.usersService.update(user._id.toString(), {
            googleId: googleId,
          });
        }
      }

      // 3. If still not found, CREATE a new user (for standard login flow ONLY)
      // This assumes logging in via Google implicitly creates an account if one doesn't exist.
      // Adjust this logic if you require explicit registration first.
      if (!user) {
        console.log(
          `LOGIN FLOW: Creating new user for Google ID ${googleId} with email ${email}`
        );
        user = await this.usersService.create({
          googleId,
          email,
          name:
            `${firstName || ''} ${lastName || ''}`.trim() ||
            email.split('@')[0],
          avatarUrl: avatar,
          // Set email as verified since it came from Google
          // Assuming create DTO/logic handles setting verificationStatus.emailVerified
          // No phoneNumber or agreedToTerms needed here based on updated CreateUserDto
        });
      }

      if (!user) {
        throw new Error('Failed to find or create user after Google auth.');
      }

      // 4. User found/created for LOGIN flow, generate JWT and set cookie
      await this._generateAndSetAuthCookie(user, res);

      // 5. Redirect to dashboard for LOGIN flow
      res.redirect(this.redirectUrl);
    } catch (error) {
      console.error(
        'Error during Google login handling (standard flow):',
        error
      );
      this._redirectWithError(res, 'google_login_failed', state);
    }
  }

  /**
   * Helper method to generate JWT and set it in an HttpOnly cookie.
   *
   * @param user - The user object.
   * @param res - The Express Response object.
   */
  private async _generateAndSetAuthCookie(
    user: User,
    res: Response
  ): Promise<void> {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      // Add any other essential, non-sensitive claims
    };

    const jwtToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: '7d', // Match the cookie maxAge
    });

    const cookieName = 'auth_token'; // Choose a suitable cookie name
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    console.log('Setting cookie for user:', user._id);

    res.cookie(cookieName, jwtToken, {
      httpOnly: true,
      secure: isProduction, // Use secure flag in production
      sameSite: 'lax', // Mitigates CSRF
      path: '/', // Cookie accessible from all paths
      maxAge: maxAge,
    });
  }

  /**
   * Helper method to redirect back to the frontend login page with an error.
   *
   * @param res - The Express Response object.
   * @param errorCode - A code representing the error.
   * @param state - Optional state object to determine redirect base URL.
   */
  private _redirectWithError(
    res: Response,
    errorCode: string,
    state?: { flow?: string }
  ): void {
    let baseUrl: string;
    if (state?.flow === 'register') {
      baseUrl =
        this.configService.get('CLIENT_URL_REGISTER') || '/auth?tab=register';
    } else {
      baseUrl = this.configService.get('CLIENT_URL_LOGIN') || '/auth';
    }
    res.redirect(`${baseUrl}&error=${errorCode}`); // Append error code
  }
}
