/** @format */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { auth } from 'firebase-admin';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
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
}
