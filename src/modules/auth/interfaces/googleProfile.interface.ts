/**
 * Interface representing the user profile data extracted from Google OAuth.
 */
export interface GoogleProfile {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  accessToken?: string; // Temporary Google access token (handle with care)
}
