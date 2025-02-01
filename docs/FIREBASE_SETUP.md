<!-- @format -->

# Firebase Setup Guide

## Overview

Firebase is used in this application for:

- Push notifications delivery (FCM)
- Device token management
- Cross-platform notification support
- Real-time notification delivery

## Setup Steps

1. **Create a Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Enter your project name
   - Follow the setup wizard

2. **Get Service Account Credentials**

   - In Firebase Console, go to Project Settings
   - Navigate to "Service Accounts" tab
   - Click "Generate New Private Key"
   - Save the JSON file securely

3. **Configure Environment Variables**

   ```env
   FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json
   ```

   Note: The service account JSON should be minified into a single line

4. **Setup Firebase Admin SDK**
   - The application automatically initializes Firebase Admin SDK
   - Initialization happens in `NotificationsService`
   - No additional setup required in the code

## Usage Examples

### Send Push Notification to Single User

```typescript
await notificationsService.sendPushNotification(
  userId,
  'New Message',
  'You have received a new message',
  { chatId: '123' }
);
```

### Send Push Notification to Multiple Users

```typescript
await notificationsService.sendMulticastNotification(
  userIds,
  'Marker Update',
  "A marker you're following has been updated",
  { markerId: '456' }
);
```

## Client Integration

### Mobile Apps

1. Install Firebase SDK
2. Initialize Firebase in your app
3. Request notification permissions
4. Get FCM token and send to server
5. Handle incoming notifications

### Web Apps

1. Add Firebase JS SDK
2. Initialize Firebase
3. Request notification permissions
4. Get FCM token and send to server
5. Set up service worker for background notifications

## Security Considerations

1. **Service Account**

   - Keep service account JSON secure
   - Never commit it to version control
   - Use environment variables

2. **Token Management**

   - Validate FCM tokens before storing
   - Remove invalid tokens automatically
   - Update tokens when they change

3. **Notification Content**
   - Don't send sensitive data in notifications
   - Use data messages for sensitive info
   - Validate notification content

## Troubleshooting

1. **Notification Not Delivered**

   - Check FCM token validity
   - Verify service account setup
   - Check device notification settings
   - Look for errors in Firebase Console

2. **Invalid Token**

   - Remove invalid token from database
   - Request new token from client
   - Update token in database

3. **Rate Limiting**
   - Implement batch sending for large audiences
   - Use topic messaging for broadcast messages
   - Follow FCM best practices

## Best Practices

1. **Token Management**

   - Store tokens securely
   - Update tokens regularly
   - Remove unused tokens

2. **Content**

   - Keep payload small
   - Use data messages for sensitive content
   - Include relevant deep links

3. **Performance**

   - Use batch operations
   - Implement retry logic
   - Monitor delivery rates

4. **User Experience**
   - Request permissions at appropriate times
   - Provide clear notification settings
   - Don't over-notify users
