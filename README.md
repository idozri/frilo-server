<!-- @format -->

# Frilo Server

A NestJS-based backend server for the Frilo application, providing real-time community help and support features.

## Features

- 👥 User Management
- 🗺️ Location-based Markers
- 💬 Real-time Chat
- 📱 Push Notifications
- 🔄 WebSocket Support
- 📊 Analytics
- 🗂️ Category Management
- 📁 File Upload (S3)
- 🗺️ Google Maps Integration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- AWS Account (for S3)
- Google Maps API Key
- Firebase Account
- Redis (optional, for WebSocket scaling)

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name

# Google Maps Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json
```

## Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run start:dev

# Build for production
npm run build

# Run in production
npm run start:prod
```

## API Documentation

The API documentation is available at `/api` when running the server. It's built using Swagger/OpenAPI.

### Main Endpoints

#### Authentication

- POST `/auth/login` - User login
- POST `/auth/register` - User registration

#### Users

- GET `/users` - Get all users
- GET `/users/:id` - Get user by ID
- PATCH `/users/:id` - Update user
- DELETE `/users/:id` - Delete user
- POST `/users/upload` - Upload user avatar

#### Markers

- POST `/markers` - Create marker
- GET `/markers` - Get all markers
- GET `/markers/:id` - Get marker by ID
- PUT `/markers/:id` - Update marker
- DELETE `/markers/:id` - Delete marker
- POST `/markers/upload` - Upload marker image
- POST `/markers/:id/apply` - Apply to help
- PUT `/markers/:id/participants/:participantId` - Update participant status

#### Chats

- POST `/chats` - Create chat
- GET `/chats` - Get user's chats
- GET `/chats/:id` - Get chat by ID
- POST `/chats/:chatId/messages` - Send message
- GET `/chats/:chatId/messages` - Get chat messages
- DELETE `/chats/messages/:messageId` - Delete message
- POST `/chats/upload` - Upload chat attachment

#### Categories

- GET `/categories` - Get all categories
- POST `/categories` - Create category
- PUT `/categories/:id` - Update category
- DELETE `/categories/:id` - Delete category

## WebSocket Events

### Client -> Server

- `joinChat` - Join a chat room
- `leaveChat` - Leave a chat room
- `typing` - Send typing indicator

### Server -> Client

- `userOnline` - User came online
- `userOffline` - User went offline
- `newMessage` - New chat message
- `userTyping` - User is typing
- `markerUpdate` - Marker was updated

## Architecture

The application follows a modular architecture using NestJS modules:

- `UsersModule` - User management
- `AuthModule` - Authentication and authorization
- `MarkersModule` - Marker management
- `ChatsModule` - Chat functionality
- `CategoriesModule` - Category management
- `S3Module` - File upload handling
- `GoogleModule` - Maps and Places integration
- `NotificationsModule` - Push notifications
- `WebsocketModule` - Real-time communication
- `AnalyticsModule` - Statistics and reporting

## File Structure

```
src/
├── config/
│   └── configuration.ts
├── modules/
│   ├── analytics/
│   ├── auth/
│   ├── categories/
│   ├── chats/
│   ├── google/
│   ├── markers/
│   ├── notifications/
│   ├── s3/
│   ├── users/
│   └── websocket/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── validators/
└── app.module.ts
```

## Security

- JWT-based authentication
- File upload validation
- WebSocket authentication
- Rate limiting
- CORS configuration
- Input validation
- MongoDB injection protection

## Scaling Considerations

- Use Redis for WebSocket scaling
- Implement caching for frequently accessed data
- Use MongoDB indexes for better query performance
- Implement pagination for large datasets
- Use AWS CloudFront for file delivery
- Implement request rate limiting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
