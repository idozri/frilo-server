/** @format */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import {
  LoginDto,
  RegisterDto,
  RequestOtpDto,
  VerifyOtpDto,
  VerifyUserDto,
  EmailLoginDto,
  GoogleAuthDto,
  ForgotPasswordRequestDto,
  ResetPasswordDto,
  LoginWithPhoneDto,
  LoginVerifiedPhoneDto,
  RegisterWithPhoneDto,
  RefreshTokenDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete user registration' })
  @ApiResponse({ status: 200, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid registration data.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('phone/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register user with phone number' })
  @ApiResponse({ status: 200, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid registration data.' })
  async registerWithPhone(@Body() registerDto: RegisterWithPhoneDto) {
    return this.authService.registerWithPhone(registerDto);
  }

  @Post('phone/login')
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
}
