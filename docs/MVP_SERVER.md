# 🛠️ Frilo MVP – Server (NestJS Backend)

## 🎯 Goal

Provide a secure, scalable backend to power the Frilo web app, including authentication, user data, help request logic, and chat API stubs.

---

## 🧱 Tech Stack

- **NestJS (v10+)**
- **MongoDB (Mongoose)**
- **JWT Auth (via Passport)**
- **CORS & Helmet security setup**
- **Cloudinary for image uploads** (optional)

---

## 👤 User Module

### Routes

- `POST /auth/register` – Handles step-based registration
- `POST /auth/login-phone` – Phone-based login (OTP stub)
- `POST /auth/login-email`
- `POST /auth/login-google`
- `GET /auth/me` – Return user data (protected)

### Fields

- `phone`, `email`, `googleId`
- `name`, `bio`, `skills`, `avatar`
- `createdAt`, `updatedAt`

---

## 🆘 Help Request Module

### Routes

- `POST /requests` – Create a new request
- `GET /requests` – List all requests (with query filters)
- `GET /requests/:id` – Get details of one request
- `POST /requests/:id/apply` – Apply to help (authenticated)

### Fields

- `category`, `title`, `description`
- `location` (coords + address string)
- `imageUrl`, `createdBy`, `applicants[]`

---

## 💬 Chat Module (Stubbed for MVP)

- `GET /chats` – List all conversations for user
- `GET /chats/:id` – Get messages (stubbed)
- `POST /chats/:id/send` – Send message (no real-time yet)

---

## 🧾 Utilities

- Centralized error handling
- Global auth guard (except for `auth` routes)
- DTO validation with `class-validator`
- Swagger docs (optional)

---

## ✅ Launch Criteria

- All auth flows tested
- Users and help requests can be created/read
- Basic application flow complete
- Server is secured (CORS, Helmet, validation)
- Integration tested with Next.js frontend
