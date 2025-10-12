# Minimal Express + MongoDB backend for IELTS Learning Platform

This lightweight server provides the REST endpoints the frontend now expects.

Endpoints implemented:
- POST /auth/signup
- POST /auth/signin
- POST /auth/signout
- GET  /auth/session
- POST /auth/reset-password
- POST /auth/update-password
- GET  /profiles
- GET  /profiles/:id
- PUT  /profiles/:id
- POST /submissions
- GET  /submissions/:id
- GET  /submissions/user/:userId
- GET  /admin/stats
- GET  /admin/recent-submissions

Environment variables:
- MONGO_URL: MongoDB connection string (default mongodb://localhost:27017/ielts-dev)
- PORT: server port (default 4000)

Install and run:

```powershell
cd server
npm install
npm run start
```

This is a development scaffold. For production, add proper authentication, secure cookies, CSRF protection, and input validation.
