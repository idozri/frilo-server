# 🛠️ Frilo – Server (NestJS Backend)

Frilo is a full-featured community backend service built with **NestJS** and **MongoDB**, powering the Frilo web client. This server handles secure authentication, user management, help request workflows, chat messaging, and notification delivery.

---

## ✅ Features

- 🔐 Multi-method Auth (Phone, Email, Google)
- 👤 User CRUD + skill/avatar/bio fields
- 🆘 Help Request creation and filtering
- 📍 Geolocation support (lat/lng + address)
- 🙋 Apply to help feature
- 💬 Chat endpoints (basic MVP)
- 🔔 Notifications system
- 🗂️ Categories API
- 📁 File uploads to S3
- 🔄 Global JWT Guards + ValidationPipe

---

## 🧰 Tech Stack

- **Backend**: NestJS v10+
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT + Passport + Google Strategy
- **File Upload**: AWS S3 (via signed URLs or upload endpoint)
- **Deployment**: Node + Docker-ready

---

## 📁 Structure Overview

```
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── markers/ ← will rename to help-requests
│   ├── chats/
│   ├── categories/
│   ├── s3/
│   ├── notifications/
│   ├── google/
│   └── websocket/
├── common/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
├── config/
└── app.module.ts
```

---

## 🔌 API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login-phone`
- `POST /auth/login-google`
- `GET /auth/me`

### Users

- `GET /users/:id`
- `PUT /users/:id`

### Help Requests (`/markers`)

- `POST /markers`
- `GET /markers`
- `GET /markers/:id`
- `POST /markers/:id/apply`

### Chats

- `GET /chats`
- `POST /chats/:id/send`

### Notifications

- `GET /notifications`

---

## 🔐 Security

- Global `ValidationPipe` enabled with whitelist
- Auth routes protected by JWT strategy
- CORS configured for cookie sharing
- Uploaded files validated before S3 transfer

---

## ⚙️ Environment Setup

```env
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=frilo-assets
```

```bash
# Install deps
npm install

# Start in dev mode
npm run start:dev
```

---

## 🧾 Docs

- [`PLANNING_SERVER.md`](../PLANNING_SERVER.md)
- [`API_DESIGN.md`](../API_DESIGN.md)
- [`MVP_SERVER.md`](../MVP_SERVER.md)

---

## 🧠 Credits

- Backend by: Ido Zairi
- Supported by: Cursor AI, OpenAI, Figma, GitHub Copilot

---

_Let’s make asking and offering help accessible to everyone._
