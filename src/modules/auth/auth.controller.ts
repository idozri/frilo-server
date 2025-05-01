/** @format */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { UsersService } from '../users/users.service';
import {
  LoginDto,
  RequestOtpDto,
  VerifyOtpDto,
  VerifyUserDto,
  EmailLoginDto,
  GoogleAuthDto,
  ForgotPasswordRequestDto,
  ResetPasswordDto,
  LoginWithPhoneDto,
  LoginVerifiedPhoneDto,
  RefreshTokenDto,
  RegisterUserDto,
  CheckUserExistsDto,
} from './dto';
import { User } from '../users/entities/user.entity';
import RegisterUserResponse from './interfaces/registerUserResponse';
import { GoogleProfile } from './interfaces/googleProfile.interface';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly usersService: UsersService
  ) {}

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid login data.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('phone/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user with phone number' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid login data.' })
  async loginWithPhone(@Body() loginDto: LoginWithPhoneDto) {
    return this.authService.loginWithPhone(loginDto);
  }

  @Post('verified-phone/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user with verified phone number' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid login data.' })
  async loginVerifiedPhone(@Body() loginDto: LoginVerifiedPhoneDto) {
    return this.authService.loginVerifiedPhone(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a new user (phone, email, or Google)' })
  @ApiBody({
    description: 'User registration data including an optional avatar file',
    schema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          example: '+15551234567',
          nullable: true,
        },
        email: { type: 'string', example: 'user@example.com', nullable: true },
        googleId: {
          type: 'string',
          example: '109876543210123456789',
          nullable: true,
        },
        name: { type: 'string', example: 'John Doe' },
        bio: {
          type: 'string',
          example: 'Loves helping others!',
          nullable: true,
        },
        skills: {
          type: 'array',
          items: { type: 'string' },
          example: ['Gardening', 'Cooking'],
          nullable: true,
        },
        language: { type: 'string', example: 'en', nullable: true },
        agreedToTerms: { type: 'boolean', example: true, nullable: true },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Optional avatar image file (e.g., jpg, png)',
          nullable: true,
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered.',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid registration data (e.g., duplicate phone/email/googleId, missing fields, invalid file type/size).',
  })
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() registerUserDto: RegisterUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      })
    )
    avatarFile?: Express.Multer.File
  ): Promise<RegisterUserResponse> {
    return await this.authService.register(registerUserDto, avatarFile, res);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP verification code' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 400, description: 'Failed to send OTP.' })
  async sendOtp(@Body() requestOtpDto: RequestOtpDto) {
    try {
      const result = await this.otpService.sendOtp(requestOtpDto);
      return {
        success: true,
        message: 'OTP sent successfully',
        ...result,
      };
    } catch (error) {
      console.error('Error in sendOtp controller:', error);
      throw error;
    }
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid OTP.' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtpDto);
  }

  @Post('verify-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user' })
  @ApiResponse({ status: 200, description: 'User verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid user.' })
  async verifyUser(@Body() verifyUserDto: VerifyUserDto) {
    return this.authService.verifyUser(verifyUserDto);
  }

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async loginWithEmail(@Body() loginDto: EmailLoginDto) {
    return this.authService.loginWithEmail(loginDto);
  }

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Google authentication failed.' })
  async loginWithGoogle(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.loginWithGoogle(googleAuthDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequestDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('check-existence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a user exists by email or phone' })
  @ApiResponse({ status: 200, description: 'Check completed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async checkUserExists(@Body() checkUserExistsDto: CheckUserExistsDto) {
    return this.authService.checkUserExists(checkUserExistsDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen.',
  })
  async googleAuth(@Req() req: Request) {
    // This guard initiates the Google OAuth2 flow. Passport handles the redirect.
    // The user will be redirected to Google for authentication.
    // No explicit logic needed here.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects user after login/registration.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during Google auth.',
  })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // The AuthGuard('google') using GoogleStrategy has already run.
    // If successful, req.user contains the profile data from GoogleStrategy.validate()
    const googleUser = req.user as GoogleProfile; // Cast to expected profile type
    const state = req.query.state as string; // Get state from query params
    let parsedState: { flow?: string } = {};
    try {
      if (state) {
        parsedState = JSON.parse(state);
      }
    } catch (e) {
      console.warn('Failed to parse state parameter:', state, e);
    }

    if (!googleUser) {
      // Handle scenario where guard failed or user is not populated
      // Redirect to login page with error
      return res.redirect('/auth?error=google_failed'); // Redirect back to frontend login
    }

    // Pass the Google user data, response object, and parsed state to the AuthService
    // The service will handle: finding/creating user, generating JWT, setting cookie, and final redirect
    await this.authService.handleGoogleLogin(googleUser, res, parsedState); // Pass state

    // Note: The final redirect is handled within authService.handleGoogleLogin
    // because it needs to set the cookie *before* redirecting.
  }
}
