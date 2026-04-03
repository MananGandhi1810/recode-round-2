# Secure Auth Workspace Setup Guide

A modern, secure authentication system built with FastAPI, Next.js, PostgreSQL, and Redis.

## Architecture

### Backend (FastAPI)
- **modular structure**: Core, models, schemas, services, and routers
- **Authentication**: OTP-based email authentication with JWT tokens
- **Email delivery**: Resend API for OTP emails
- **Session storage**: Redis for OTP codes (hashed)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Security**: httpOnly cookies, CORS, password hashing with bcrypt
- **Cookie-based JWT**: Secure session management without localStorage

### Frontend (Next.js)
- **Dark/light mode**: Full theme support with next-themes
- **Responsive UI**: Built with Tailwind CSS and shadcn components
- **State management**: React hooks for OTP, org, and member flows
- **API integration**: Secure fetch with credentials
- **Theme toggle**: Keyboard shortcut (D key) + UI toggle button

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Resend account (for email OTPs)

## Backend Setup

### 1. Environment Configuration

Edit `backend/.env` with required variables:

```env
# Server
PORT=8000
ENVIRONMENT=development
SECRET_KEY=your-secure-random-key-here-change-in-production

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/workspace_auth

# Redis (for OTP storage)
REDIS_URL=redis://localhost:6379/0

# Email (Resend)
RESEND_API_KEY=your-resend-api-key-here
RESEND_SENDER_EMAIL=noreply@yourdomain.com
RESEND_SENDER_NAME=Your App Name

# Frontend
FRONTEND_URL=http://localhost:3000

# Auth
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
# OR if using uv:
uv pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Ensure PostgreSQL is running
# Create database
createdb workspace_auth

# Tables are created automatically on startup
```

### 4. Redis Setup

```bash
# Start Redis (if not already running)
redis-server

# Verify connection
redis-cli ping
# Should return: PONG
```

### 5. Start Backend

```bash
cd backend
python main.py
# Server runs on http://localhost:8000
```

Visit `http://localhost:8000/docs` for Swagger UI and API documentation.

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Environment Configuration

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
cd frontend
pnpm dev
# App runs on http://localhost:3000
```

## API Endpoints

### Authentication (`/auth`)

- **POST** `/auth/request-otp` - Request OTP email
  ```json
  {
    "email": "user@example.com",
    "full_name": "John Doe"
  }
  ```

- **POST** `/auth/verify-otp` - Verify OTP and sign in
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "full_name": "John Doe"
  }
  ```

- **GET** `/auth/me` - Get current user (requires httpOnly cookie)

- **POST** `/auth/logout` - Logout (clears httpOnly cookie)

### Organizations (`/organizations`)

- **GET** `/organizations` - List user's organizations

- **POST** `/organizations` - Create organization (creator becomes owner)
  ```json
  {
    "name": "ACME Corp"
  }
  ```

- **GET** `/organizations/{org_id}/members` - List organization members

- **POST** `/organizations/{org_id}/members` - Add member (owner only)
  ```json
  {
    "email": "member@example.com",
    "role": "member"  // or "owner"
  }
  ```

### Health

- **GET** `/health` - Service health check

## Security Features

### Authentication Security
- ✅ **Email OTP**: No passwords stored
- ✅ **httpOnly Cookies**: JWT in secure, httpOnly cookies (CSRF + XSS protected)
- ✅ **OTP Hashing**: Redis stores scrypt-hashed OTPs, not plain text
- ✅ **OTP Expiration**: 15-minute validity window
- ✅ **Rate Limiting**: Max 3 OTP requests per email per hour

### Authorization
- ✅ **Organization ownership**: Only creators (owners) can manage members
- ✅ **Role-based access**: Owner/member roles enforced
- ✅ **User isolation**: Users only see their organizations

### Transport Security
- ✅ **CORS**: Configured for localhost:3000 only
- ✅ **HTTPS-ready**: Full support for SSL/TLS deployment
- ✅ **Environment secrets**: All keys loaded from env vars

## Usage Flow

### 1. Sign In
1. Enter email and optional name
2. Click "Send OTP"
3. Check email for 6-digit code
4. Enter code and click "Verify and sign in"
5. Logged in securely with httpOnly JWT cookie

### 2. Create Organization
1. Enter organization name
2. Click "Create org"
3. You're set as owner automatically

### 3. Add Members
1. Select organization
2. Enter member email
3. Choose role (Member or Owner)
4. Click "Add member"
5. Member receives email with link to join

### 4. Theme Toggle
- Click moon/sun icon in header
- Or press **D** key to toggle theme

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Check database connection
psql postgresql://user:password@localhost:5432/workspace_auth

# Check Redis connection
redis-cli ping
```

### OTP not sending
- Verify `RESEND_API_KEY` in `.env`
- Check `RESEND_SENDER_EMAIL` is verified in Resend dashboard
- Check backend logs for Resend errors

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`
- Clear browser cache and cookies

### Database errors
- Ensure PostgreSQL is running
- Check `DATABASE_URL` connection string
- Verify database exists: `psql -l`

## Production Deployment

### Security Checklist
- [ ] Change `SECRET_KEY` to strong random value
- [ ] Use PostgreSQL with strong password
- [ ] Use Redis with authentication/firewall
- [ ] Enable HTTPS/TLS
- [ ] Update CORS allowed origins
- [ ] Use real Resend API key
- [ ] Set `ENVIRONMENT=production`
- [ ] Use environment-specific configs

### Database Migrations
```bash
# Tables auto-create on startup
# For advanced migrations, integrate Alembic
pip install alembic
alembic init alembic
```

### Docker Deployment
```bash
# Backend
docker build -t workspace-auth-api .
docker run -p 8000:8000 --env-file .env workspace-auth-api

# Frontend
npm run build && npm run start
```

## Development

### File Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Settings from env
│   │   ├── database.py        # SQLAlchemy setup
│   │   ├── redis.py           # Redis client
│   │   └── security.py        # JWT, hashing
│   ├── models/
│   │   ├── user.py
│   │   └── organization.py
│   ├── schemas/
│   │   ├── auth.py
│   │   └── organization.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── otp_service.py
│   │   ├── email_service.py
│   │   └── organization_service.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── health.py
│   │   └── organizations.py
│   └── main.py
├── main.py                     # Entry point
├── requirements.txt
└── .env

frontend/
├── app/
│   ├── layout.tsx             # Root with theme provider
│   ├── page.tsx               # Auth UI
│   └── globals.css            # Tailwind
├── components/
│   ├── theme-provider.tsx     # next-themes setup
│   ├── theme-toggle.tsx       # Dark/light toggle
│   └── ui/
│       └── button.tsx
├── lib/
│   ├── api.ts                 # Fetch wrapper
│   └── utils.ts               # Tailwind merge
├── hooks/
└── package.json
```

## API Response Examples

### Successful OTP Request
```json
{
  "message": "OTP sent to email"
}
```

### Successful Verification
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Error Response
```json
{
  "detail": "Invalid OTP or expired"
}
```

## Support & Next Steps

- Add database migrations (Alembic)
- Implement email verification before first login
- Add 2FA/MFA
- Build membership invitation system
- Add API key authentication for programmatic access
- Implement activity logging
- Build admin dashboard

---

**Build with security first. Test in dev. Deploy with confidence.**
