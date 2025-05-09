# 📘 PLANNING_SERVER.md – Frilo Backend (NestJS)

## 🌍 Overview

This document outlines the backend structure and goals for the **Frilo app's NestJS server**. The backend provides secure, modular APIs for user management, help requests, chat, notifications, and more.

---

## 🧰 Tech Stack

- **Framework**: NestJS 10+
- **Database**: MongoDB (with Mongoose)
- **Auth**: JWT (Phone, Email, Google)
- **Media Storage**: S3 (via dedicated module)
- **Security**: CORS, DTO Validation, Global Guards

---

## 📁 Folder Structure

```
/server/src
  /auth
  /users
  /help-requests     ← originally 'markers'
  /chats
  /notifications
  /categories
  /google
  /s3
  /common (guards, filters)
```

---

## 🔐 Auth Module

- Multi-step registration and login
- Auth methods: Phone, Email, Google
- JWT token generation
- Validates Google avatar authenticity

---

## 🆘 Help Request Module

- Create + retrieve help requests
- Applicants array for helpers
- Location field (address, lat/lng)
- Planned: apply to help, report abuse

---

## 💬 Chat Module

- Messages stored per request + user pair
- Stubbed for MVP (to be expanded with sockets)

---

## 🔔 Notification Module

- Store and fetch in-app notifications
- Badge indicators on unread notifications

---

## 📦 Other Modules

- `s3`: Handles file upload logic
- `categories`: Fixed list for request types
- `google`: Validate Google login & image source
- `analytics`, `achievements`, `reactions`: Non-MVP extras

---

## ✅ MVP Goals

- [x] Implement multi-step registration (phone/email/google) with DTO validation
- [x] Login flow with JWT token generation and cookie return
- [x] Create help requests with full location, category, and optional image
- [x] Fetch all help requests and individual request details
- [x] Apply to help functionality per request
- [x] Upload user avatar and request image to S3 via dedicated endpoint
- [ ] List and fetch notifications per user
- [ ] Enable chat endpoints (send + receive; no sockets yet)
- [ ] Protect all APIs with guards and ValidationPipe
- [ ] Prepare server for production (CORS, Helmet, sanitization)

---

## 🔐 Security Guidelines

- Global JWT guard for protected routes
- Public routes: auth only (register/login)
- ValidationPipe with whitelist + forbidNonWhitelisted
- NestJS guards for user role/moderation (future)

---

## 🧠 Cursor Rules

- Use DTOs and services; no logic in controllers
- Always register new modules in `app.module.ts`
- All new APIs require validation
- Keep controller files under 500 LOC

---
