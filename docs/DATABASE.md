# Frilo App - Database Documentation

## 1. Introduction

Frilo utilizes MongoDB, a NoSQL document database, for storing its application data. Data is organized into collections of BSON documents. Each document represents an entity (like a user or a help request) and contains key-value pairs. Relationships between documents are typically managed using `ObjectId` references.

This document provides an overview of the main collections, their schemas, relationships, and example documents.

## 2. Collections Overview

The primary collections used in the Frilo application are:

- **`users`**: Stores user profile information, authentication details, settings, and associated data.
- **`markers`**: Stores details about help requests and help offers posted by users, including location, description, status, and participants.
- **`chats`**: Represents conversations between users or groups, linking participants and messages.
- **`messages`**: Stores individual messages exchanged within chats.
- **`notifications`**: Holds notifications generated for users based on application events.
- **`categories`**: Stores predefined categories for markers (help requests/offers). (Assumed, based on `Marker.categoryId`)
- **`achievements`**: Stores definitions for achievements users can earn. (Assumed, based on `User.achievementIds`)
- **`badges`**: Stores definitions for badges users can earn. (Assumed, based on `User.badgeIds`)

_(Note: `categories`, `achievements`, and `badges` are inferred based on references in other schemas. Their specific structures should be verified if needed.)_

## 3. Collection Schemas

### `users` Collection

Stores information about registered users.

| Field                    | Data Type             | Required                     | Description                                                           | Notes                                                                             |
| :----------------------- | :-------------------- | :--------------------------- | :-------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| `_id`                    | ObjectId              | Yes (implicit)               | Unique identifier for the user document.                              | Primary key.                                                                      |
| `name`                   | String                | No                           | User's display name.                                                  |                                                                                   |
| `email`                  | String                | Conditionally (if no phone)  | User's email address.                                                 | Unique, Sparse Index. Required if `phoneNumber` is not provided.                  |
| `googleId`               | String                | No                           | User's Google ID for Google Sign-In.                                  | Unique, Sparse Index.                                                             |
| `avatarUrl`              | String                | No                           | URL of the user's profile picture.                                    |                                                                                   |
| `bio`                    | String                | No                           | Short biography or description provided by the user.                  |                                                                                   |
| `skills`                 | Array<String>         | No                           | List of skills the user possesses.                                    | Default: `[]`                                                                     |
| `password`               | String                | No                           | Hashed password for email/password authentication.                    | Excluded from default query results.                                              |
| `friendIds`              | Array<String>         | No                           | List of user IDs representing friends.                                | Default: `[]`                                                                     |
| `completedRequests`      | Number                | No                           | Count of help requests the user has successfully completed.           | Default: `0`                                                                      |
| `isOnline`               | Boolean               | No                           | Indicates if the user is currently online.                            | Default: `false`                                                                  |
| `lastSeen`               | Date                  | No                           | Timestamp of the user's last activity.                                |                                                                                   |
| `isActive`               | Boolean               | No                           | Indicates if the user account is active.                              | Default: `true`                                                                   |
| `phoneNumber`            | String                | Conditionally (if no email)  | User's phone number.                                                  | Unique, Sparse Index. Required if `email` is not provided.                        |
| `isPhoneVerified`        | Boolean               | No                           | Flag indicating if the phone number has been verified.                | Default: `false`                                                                  |
| `hasAcceptedSafetyGuide` | Boolean               | No                           | Flag indicating acceptance of safety guidelines.                      | Default: `false`                                                                  |
| `agreedToTerms`          | Boolean               | No                           | Flag indicating acceptance of terms and conditions.                   | Default: `false`                                                                  |
| `points`                 | Number                | No                           | User's points or reputation score.                                    | Default: `0`                                                                      |
| `verificationStatus`     | Object                | No                           | Status of various verification types.                                 | Contains `emailVerified`, `phoneVerified`, `idVerified` (Booleans). Default: `{}` |
| `location`               | GeoJSON Point         | No                           | User's geographical location.                                         | `type: 'Point'`, `coordinates: [longitude, latitude]`. Default: `[0,0]`           |
| `language`               | String ('en' \| 'he') | No                           | User's preferred language.                                            | Default: `'en'`                                                                   |
| `achievementIds`         | Array<ObjectId>       | No                           | IDs referencing earned achievements in the `achievements` collection. | Ref: `UserAchievement`. Default: `[]`                                             |
| `badgeIds`               | Array<ObjectId>       | No                           | IDs referencing earned badges in the `badges` collection.             | Ref: `UserBadge`. Default: `[]`                                                   |
| `createdAt`              | Date                  | Yes (implicit by timestamps) | Document creation timestamp.                                          | Added by `timestamps: true`.                                                      |
| `updatedAt`              | Date                  | Yes (implicit by timestamps) | Document last update timestamp.                                       | Added by `timestamps: true`.                                                      |

### `markers` Collection

Stores help requests and help offers.

| Field                 | Data Type                             | Required                     | Description                                                               | Notes                                                                        |
| :-------------------- | :------------------------------------ | :--------------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------- |
| `_id`                 | ObjectId                              | Yes (implicit)               | Unique identifier for the marker document.                                | Primary key.                                                                 |
| `title`               | String                                | Yes                          | Title of the help request or offer.                                       |                                                                              |
| `description`         | String                                | Yes                          | Detailed description of the help request or offer.                        |                                                                              |
| `participants`        | Array<Object>                         | No                           | Users participating or applying (e.g., helpers for a request).            | Each object has `userId` (String), `status` (String), `joinedAt` (String).   |
| `images`              | Array<String>                         | No                           | URLs of images associated with the marker.                                | Default: `[]`                                                                |
| `location`            | GeoJSON Point                         | Yes                          | Geographical location of the marker.                                      | `type: 'Point'`, `coordinates: [longitude, latitude]`. Indexed (`2dsphere`). |
| `address`             | String                                | No                           | Human-readable address string.                                            |                                                                              |
| `locationDescription` | String                                | No                           | Additional details about the location.                                    |                                                                              |
| `categoryId`          | ObjectId                              | Yes                          | ID referencing the category in the `categories` collection.               | Ref: `Category`.                                                             |
| `ownerId`             | ObjectId                              | Yes                          | ID referencing the user who created the marker in the `users` collection. | Ref: `User`.                                                                 |
| `priority`            | String (Enum: Low, Medium, High)      | No                           | Priority level of the marker.                                             | Enum: `MarkerPriority`. Default: `Medium`.                                   |
| `rating`              | Number                                | No                           | Average rating given to the marker (e.g., after completion).              | Default: `0`                                                                 |
| `reviewCount`         | Number                                | No                           | Number of reviews received.                                               | Default: `0`                                                                 |
| `status`              | String (Enum: Active, Completed, ...) | No                           | Current status of the marker.                                             | Enum: `MarkerStatus`. Default: `Active`.                                     |
| `isFavorited`         | Boolean                               | No                           | Indicates if the current user has favorited this marker.                  | Default: `false`. (Likely user-specific, may need clarification).            |
| `verified`            | Boolean                               | No                           | Indicates if the marker has been verified (e.g., by admin).               | Default: `false`.                                                            |
| `contactPhone`        | String                                | No                           | Optional contact phone number for the marker.                             |                                                                              |
| `visitCount`          | Number                                | No                           | Number of times the marker details have been viewed.                      | Default: `0`                                                                 |
| `imageUrl`            | String                                | No                           | Primary image URL for the marker.                                         |                                                                              |
| `isActive`            | Boolean                               | No                           | Indicates if the marker is active/visible.                                | Default: `true`.                                                             |
| `createdAt`           | Date                                  | Yes (implicit by timestamps) | Document creation timestamp.                                              | Added by `timestamps: true`.                                                 |
| `updatedAt`           | Date                                  | Yes (implicit by timestamps) | Document last update timestamp.                                           | Added by `timestamps: true`.                                                 |

### `chats` Collection

Stores information about conversations.

| Field           | Data Type                     | Required                     | Description                                                                                         | Notes                                                                          |
| :-------------- | :---------------------------- | :--------------------------- | :-------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| `_id`           | ObjectId                      | Yes (implicit)               | Unique identifier for the chat document.                                                            | Primary key.                                                                   |
| `title`         | String                        | Yes                          | Title of the chat (e.g., user names for private, group name for group).                             |                                                                                |
| `participants`  | Array<String>                 | Yes                          | List of user IDs participating in the chat.                                                         | References `_id` in `users` collection.                                        |
| `type`          | String (Enum: group, private) | No                           | Type of chat.                                                                                       | Enum: `ChatType`. Default: `group`.                                            |
| `groupName`     | String                        | No                           | Name of the group chat (if `type` is `group`).                                                      |                                                                                |
| `groupAvatar`   | String                        | No                           | URL of the group chat's avatar (if `type` is `group`).                                              |                                                                                |
| `admins`        | Array<String>                 | No                           | List of user IDs who are admins of the group chat.                                                  | Default: `[]`. References `_id` in `users` collection.                         |
| `blockedUsers`  | Array<String>                 | No                           | List of user IDs blocked within this chat.                                                          | Default: `[]`. References `_id` in `users` collection.                         |
| `typingUsers`   | Array<String>                 | No                           | List of user IDs currently typing in the chat.                                                      | Default: `[]`. References `_id` in `users` collection.                         |
| `mutedUsers`    | Array<String>                 | No                           | List of user IDs who have muted this chat.                                                          | Default: `[]`. References `_id` in `users` collection.                         |
| `unreadCount`   | Object                        | No                           | Map of userId to the count of unread messages for that user in this chat.                           | Key: `userId` (String), Value: `count` (Number). Default: `{}`.                |
| `lastMessageId` | String                        | No                           | ID of the most recent message in this chat.                                                         | References `_id` in `messages` collection.                                     |
| `markerId`      | String                        | No                           | ID of the marker associated with this chat, if any.                                                 | References `_id` in `markers` collection.                                      |
| `messageIds`    | Array<String>                 | No                           | List of message IDs belonging to this chat. _(Potentially redundant if using `chatId` in messages)_ | Default: `[]`. References `_id` in `messages` collection. (Virtual Population) |
| `createdAt`     | Date                          | Yes (implicit by timestamps) | Document creation timestamp.                                                                        | Added by `timestamps: true`.                                                   |
| `updatedAt`     | Date                          | Yes (implicit by timestamps) | Document last update timestamp.                                                                     | Added by `timestamps: true`.                                                   |

### `messages` Collection

Stores individual chat messages.

| Field              | Data Type                       | Required                     | Description                                                                | Notes                                                         |
| :----------------- | :------------------------------ | :--------------------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------ |
| `_id`              | ObjectId                        | Yes (implicit)               | Unique identifier for the message document.                                | Primary key.                                                  |
| `chatId`           | String (ObjectId)               | Yes                          | ID of the chat this message belongs to.                                    | References `_id` in `chats` collection. Indexed.              |
| `senderId`         | String (ObjectId)               | Yes                          | ID of the user who sent the message.                                       | References `_id` in `users` collection. Indexed.              |
| `receiverId`       | String (ObjectId)               | No                           | ID of the recipient user (relevant for specific use cases, e.g., private). | References `_id` in `users` collection.                       |
| `text`             | String                          | No                           | The textual content of the message.                                        | Default: `''`.                                                |
| `type`             | String (Enum: text, image, ...) | No                           | Type of the message content.                                               | Enum: `MessageType`. Default: `'text'`.                       |
| `mediaUrls`        | Array<String>                   | No                           | URLs for media attachments (images, videos, etc.).                         | Default: `[]`.                                                |
| `audioMetering`    | Array<Number>                   | No                           | Data for audio waveform visualization.                                     | Default: `null`.                                              |
| `replyToMessageId` | String (ObjectId)               | No                           | ID of the message this message is replying to.                             | References `_id` in `messages` collection.                    |
| `isRead`           | Boolean                         | No                           | Flag indicating if the message has been read by the recipient(s).          | Default: `false`.                                             |
| `isDelivered`      | Boolean                         | No                           | Flag indicating if the message has been delivered.                         | Default: `false`.                                             |
| `isEdited`         | Boolean                         | No                           | Flag indicating if the message has been edited.                            | Default: `false`.                                             |
| `isDeleted`        | Boolean                         | No                           | Flag indicating if the message has been deleted (soft delete).             | Default: `false`.                                             |
| `readAt`           | Date                            | No                           | Timestamp when the message was read.                                       |                                                               |
| `attachments`      | Array<Object>                   | No                           | Detailed file attachments information.                                     | Each object has `url`, `type`, `name`, `size`. Default: `[]`. |
| `readBy`           | Array<String>                   | No                           | List of user IDs who have read this message (useful in group chats).       | Default: `[]`. References `_id` in `users` collection.        |
| `createdAt`        | Date                            | Yes (implicit by timestamps) | Document creation timestamp.                                               | Added by `timestamps: true`. Indexed.                         |
| `updatedAt`        | Date                            | Yes (implicit by timestamps) | Document last update timestamp.                                            | Added by `timestamps: true`.                                  |

### `notifications` Collection

Stores notifications for users.

| Field       | Data Type                           | Required                     | Description                                                          | Notes                                                                 |
| :---------- | :---------------------------------- | :--------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| `_id`       | ObjectId                            | Yes (implicit)               | Unique identifier for the notification document.                     | Primary key.                                                          |
| `userIds`   | Array<String>                       | Yes                          | List of user IDs this notification is intended for.                  | References `_id` in `users` collection. Indexed.                      |
| `title`     | String                              | Yes                          | The title of the notification.                                       |                                                                       |
| `message`   | String                              | Yes                          | The main content/message of the notification.                        |                                                                       |
| `type`      | String (Enum: message, marker\_...) | Yes                          | The type of event that triggered the notification.                   | Enum: `NotificationType`. Indexed.                                    |
| `readBy`    | Object                              | No                           | Map indicating which users have read the notification.               | Key: `userId` (String), Value: `readStatus` (Boolean). Default: `{}`. |
| `action`    | Object                              | No                           | Defines an action associated with the notification (e.g., navigate). | Contains `type` ('marker'\|'chat') and `id` (String - ObjectId).      |
| `createdAt` | Date                                | Yes (implicit by timestamps) | Document creation timestamp.                                         | Added by `timestamps: true`. Indexed.                                 |
| `updatedAt` | Date                                | Yes (implicit by timestamps) | Document last update timestamp.                                      | Added by `timestamps: true`.                                          |

## 4. Relationships

- **User <> Marker**:
  - One `User` (`ownerId`) creates many `Markers`. (One-to-Many)
  - Many `Users` can be `participants` in one `Marker`. (Many-to-Many through the `participants` array)
- **User <> Chat**:
  - Many `Users` are `participants` in one `Chat`. (Many-to-Many through the `participants` array)
- **User <> Message**:
  - One `User` (`senderId`) sends many `Messages`. (One-to-Many)
- **Chat <> Message**:
  - One `Chat` (`chatId`) contains many `Messages`. (One-to-Many)
  - A `Chat` may store `messageIds` (Many-to-Many reference array, virtual population).
- **User <> Notification**:
  - One `Notification` can target multiple `Users` (`userIds`). (One-to-Many logical relationship)
  - Many `Notifications` can belong to one `User` (filtered by `userIds`).
- **Marker <> Chat**:
  - One `Marker` (`markerId`) can optionally be associated with one `Chat`. (One-to-One, optional)
- **Marker <> Category**:
  - One `Marker` (`categoryId`) belongs to one `Category`. (Many-to-One)
- **User <> Achievement/Badge**:
  - One `User` can have many `Achievements` (`achievementIds`) and `Badges` (`badgeIds`). (Many-to-Many via reference arrays)

## 5. Example Documents

_(Note: ObjectIds are represented as strings for readability)_

### `users` Example

```json
{
  "_id": "60c72b2f9b1d8e001c8a4b1a",
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "googleId": "109876543210987654321",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Loves helping people and coding!",
  "skills": ["Gardening", "Tutoring", "Web Development"],
  "friendIds": ["60c72b2f9b1d8e001c8a4b1b", "60c72b2f9b1d8e001c8a4b1c"],
  "completedRequests": 5,
  "isOnline": true,
  "lastSeen": "2023-10-27T10:00:00.000Z",
  "isActive": true,
  "phoneNumber": "+15551234567",
  "isPhoneVerified": true,
  "hasAcceptedSafetyGuidelines": true,
  "agreedToTerms": true,
  "points": 150,
  "verificationStatus": {
    "emailVerified": true,
    "phoneVerified": true,
    "idVerified": false
  },
  "location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.73061]
  },
  "language": "en",
  "achievementIds": ["61d0a1b2c3d4e5f6a7b8c9d0"],
  "badgeIds": ["61d0a2b3c4d5e6f7a8b9c0d1"],
  "createdAt": "2023-01-15T09:30:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

### `markers` Example (Help Request)

```json
{
  "_id": "60c72b3a9b1d8e001c8a4b2a",
  "title": "Need help mowing my lawn",
  "description": "My lawnmower broke down, and I need assistance mowing my front yard this weekend.",
  "participants": [
    {
      "userId": "60c72b2f9b1d8e001c8a4b1b",
      "status": "accepted",
      "joinedAt": "2023-10-26T14:00:00.000Z"
    }
  ],
  "images": ["https://example.com/lawn.jpg"],
  "location": {
    "type": "Point",
    "coordinates": [-74.005974, 40.712776]
  },
  "address": "123 Main St, Anytown, USA",
  "locationDescription": "House with the red door",
  "categoryId": "5fecb3b4a1b2c3d4e5f6a7b8", // ObjectId for 'Home & Garden' Category
  "ownerId": "60c72b2f9b1d8e001c8a4b1a", // Jane Doe's ID
  "priority": "Medium",
  "rating": 0,
  "reviewCount": 0,
  "status": "In progress",
  "isFavorited": false,
  "verified": true,
  "contactPhone": "+15559876543",
  "visitCount": 15,
  "imageUrl": "https://example.com/lawn.jpg",
  "isActive": true,
  "createdAt": "2023-10-25T11:00:00.000Z",
  "updatedAt": "2023-10-26T14:05:00.000Z"
}
```

### `chats` Example (Private Chat)

```json
{
  "_id": "60c72b459b1d8e001c8a4b3a",
  "title": "Jane Doe, John Smith",
  "participants": ["60c72b2f9b1d8e001c8a4b1a", "60c72b2f9b1d8e001c8a4b1b"],
  "type": "private",
  "admins": [],
  "blockedUsers": [],
  "typingUsers": ["60c72b2f9b1d8e001c8a4b1b"],
  "mutedUsers": [],
  "unreadCount": {
    "60c72b2f9b1d8e001c8a4b1a": 2
  },
  "lastMessageId": "60c72b5a9b1d8e001c8a4b4c",
  "messageIds": [
    "60c72b5a9b1d8e001c8a4b4a",
    "60c72b5a9b1d8e001c8a4b4b",
    "60c72b5a9b1d8e001c8a4b4c"
  ],
  "createdAt": "2023-10-26T09:00:00.000Z",
  "updatedAt": "2023-10-27T11:05:00.000Z"
}
```

### `messages` Example

```json
{
  "_id": "60c72b5a9b1d8e001c8a4b4c",
  "chatId": "60c72b459b1d8e001c8a4b3a", // Chat between Jane and John
  "senderId": "60c72b2f9b1d8e001c8a4b1b", // John Smith's ID
  "receiverId": "60c72b2f9b1d8e001c8a4b1a", // Jane Doe's ID (optional here)
  "text": "Okay, I can help with the lawn mowing!",
  "type": "text",
  "mediaUrls": [],
  "audioMetering": null,
  "replyToMessageId": null,
  "isRead": false,
  "isDelivered": true,
  "isEdited": false,
  "isDeleted": false,
  "readAt": null,
  "attachments": [],
  "readBy": [],
  "createdAt": "2023-10-27T11:05:00.000Z",
  "updatedAt": "2023-10-27T11:05:00.000Z"
}
```

### `notifications` Example

```json
{
  "_id": "60c72b6a9b1d8e001c8a4b5a",
  "userIds": ["60c72b2f9b1d8e001c8a4b1a"], // Notification for Jane Doe
  "title": "Application Accepted",
  "message": "John Smith has accepted your application to help with 'Need help mowing my lawn'.",
  "type": "marker_application",
  "readBy": {
    "60c72b2f9b1d8e001c8a4b1a": false
  },
  "action": {
    "type": "marker",
    "id": "60c72b3a9b1d8e001c8a4b2a" // ID of the lawn mowing marker
  },
  "createdAt": "2023-10-26T14:05:00.000Z",
  "updatedAt": "2023-10-26T14:05:00.000Z"
}
```

## 6. Best Practices

- **Indexing**: Ensure frequently queried fields are indexed for performance. Key indexes include:
  - `users`: `email`, `phoneNumber`, `googleId` (unique, sparse), `location` (2dsphere)
  - `markers`: `location` (2dsphere), `ownerId`, `categoryId`, `status`
  - `chats`: `participants`
  - `messages`: `chatId`, `senderId`, `createdAt`
  - `notifications`: `userIds`, `type`, `createdAt`
- **Timestamps**: All major collections use `{ timestamps: true }` in their Mongoose schemas, automatically adding `createdAt` and `updatedAt` fields managed by Mongoose.
- **ObjectId References**: Relationships between collections are maintained using `ObjectId` references (stored as strings or ObjectId types in the schema definitions). Use Mongoose's `.populate()` or virtuals to resolve these references when needed.
- **Soft Deletes**: Some schemas (e.g., `messages`) use an `isDeleted` flag for soft deletes instead of permanently removing documents. Consider implementing this pattern where appropriate if data recovery or auditing is necessary.
- **GeoJSON**: For location data (`users`, `markers`), use the standard GeoJSON `Point` format with `coordinates` as `[longitude, latitude]` and leverage MongoDB's geospatial indexing (`2dsphere`) and query capabilities.
