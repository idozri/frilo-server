import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth 2.0 Strategy for NestJS Passport.
 *
 * This strategy handles the authentication flow with Google.
 * It uses the 'passport-google-oauth20' library.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'), // Ensure these are in your .env
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'), // Server-side callback URL
      scope: ['email', 'profile'],
    });
  }

  /**
   * Validate method called by Passport after successful Google authentication.
   *
   * @param accessToken - Google access token.
   * @param refreshToken - Google refresh token (if requested via access_type: 'offline').
   * @param profile - User profile information returned by Google.
   * @param done - Callback function to be called when validation is complete.
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    // Extract relevant user information from the Google profile
    const { id, name, emails, photos } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value, // Safely access email
      firstName: name?.givenName,
      lastName: name?.familyName,
      avatar: photos?.[0]?.value,
      // Include the access token temporarily for the AuthService to potentially use.
      // IMPORTANT: Do not store this long-term or send it to the client.
      accessToken,
    };

    // Pass the extracted user details to the framework.
    // This 'user' object will be available as `req.user` in the route handler
    // if the GoogleAuthGuard is used.
    done(null, user);
  }
}
