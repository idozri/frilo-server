# 📘 Frilo API Design (NestJS Server)

This document outlines the backend API routes and logic powering the Frilo web app. It reflects the current backend structure (originally using `marker` as the entity name) and translates it semantically as `helpRequest` for clarity.

---

## 👤 Auth Module

### POST /auth/register

- Registers a new user
- Supports step-based input (phone/email/google, name, bio, skills, avatar)

### POST /auth/login-phone

- Accepts phone number, issues temporary login token (OTP logic not yet present)

### POST /auth/login-email

- Logs in with email/password

### POST /auth/login-google

- Authenticates with Google

### GET /auth/me

- Returns current authenticated user's profile

---

## 🆘 Help Request Module (Previously `marker`)

### POST /help-requests

- Creates a new help request
- Requires category, title, description, location (lat/lng), and optional image

### GET /help-requests

- Returns list of all help requests
- Can be filtered (category, proximity, etc.)

### GET /help-requests/\:id

- Returns full data of a specific help request

### POST /help-requests/\:id/apply

- Authenticated user applies to help on a request

---

## 🧑 Users Module

### GET /users/\:id

- Get user profile by ID

### PUT /users/\:id

- Update user profile (bio, name, skills, avatar)

---

## 💬 Chat Module

### GET /chats

- Returns chat conversations for current user

### GET /chats/\:id

- Get messages in a conversation (basic for now)

### POST /chats/\:id/send

- Sends a message (no socket logic shown here)

---

## 🔔 Notifications Module

### GET /notifications

- Returns notifications for the logged-in user

---

## 📂 S3 (Media Upload) Module

### POST /s3/upload

- Uploads file to cloud storage (presumably image uploads for avatars or help requests)

---

## 🌍 Categories Module

### GET /categories

- Returns predefined list of help categories (used in create-request flow)

---

## 🧪 Additional Modules

These modules exist but are less critical to MVP and may be handled later:

- `analytics`
- `achievements`
- `reactions`
- `websocket`
- `data-init`
- `google`
- `app-data`

---

## ✅ Naming Convention Suggestion

- Rename `marker` → `helpRequest` across:
  - DTOs, services, controllers, schema
  - API routes
- Improves clarity for developers and aligns with frontend language

---

## 🛡️ Global Server Design Best Practices

- Uses `ValidationPipe` and DTOs for all inputs
- JWT Auth with Passport Strategy
- Modular NestJS design
- MongoDB via Mongoose schemas
- Structure ready for growth, feature separation is solid

---

## 🗂 Recommended Folder Naming Refactor

```
src/
  help-requests/  ← was: markers/
    help-requests.controller.ts
    help-requests.service.ts
    dto/
    schemas/
```
