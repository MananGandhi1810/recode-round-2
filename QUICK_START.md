# Quick Start Guide

## 5-Minute Setup (Local Development)

### Prerequisites Check
```bash
# Python 3.11+
python3 --version

# Node.js 20+
node --version
pnpm --version

# PostgreSQL
psql --version

# Redis
redis-cli --version
```

### Step 1: Database Setup (1 min)
```bash
# Start PostgreSQL (if not running as service)
# On macOS with Homebrew:
brew services start postgresql

# Create database
createdb workspace_auth

# Start Redis
redis-server &
```

### Step 2: Backend Setup (2 min)
```bash
cd backend

# Update .env with your values:
# - RESEND_API_KEY (from https://resend.com)
# - RESEND_SENDER_EMAIL (verified in Resend)
# - SECRET_KEY (optional for dev, change for production)

# Install dependencies
uv pip install -r requirements.txt

# Start server
python main.py
# ✅ Backend ready on http://localhost:8000
```

### Step 3: Frontend Setup (2 min)
```bash
cd frontend

# Create .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Install dependencies
pnpm install

# Start dev server
pnpm dev
# ✅ Frontend ready on http://localhost:3000
```

### Step 4: Test the Flow
1. Open http://localhost:3000
2. Enter email and name
3. Click "Send OTP"
4. Check email for code
5. Enter OTP and sign in
6. Create organization
7. Add members
8. Toggle theme with D key

---

## Minimal .env Configuration

**For testing, only these are required:**

```env
PORT=8000
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/workspace_auth
REDIS_URL=redis://localhost:6379/0
RESEND_API_KEY=your_key_here
RESEND_SENDER_EMAIL=your_verified_email@example.com
RESEND_SENDER_NAME=Test App
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `psql: error: connection refused` | Start PostgreSQL: `brew services start postgresql` |
| `Redis connection refused` | Start Redis: `redis-server` or `brew services start redis` |
| `OTP not sending` | Check RESEND_API_KEY and RESEND_SENDER_EMAIL in .env |
| `Port 8000 in use` | Kill process: `lsof -i :8000` then `kill -9 <PID>` |
| `CORS error on frontend` | Ensure backend is running on http://localhost:8000 |

---

## What Each Component Does

### 🔐 Backend (FastAPI)
- Email OTP generation and verification
- User account creation
- Organization management (CRUD)
- Organization member management (add, remove, role assignment)
- JWT token generation (httpOnly cookies)

### 🎨 Frontend (Next.js)
- Beautiful, responsive auth UI
- Dark/light mode toggle (keyboard + button)
- Real-time form validation
- Organization creation and member management
- Theme persistence

### 📧 Email (Resend)
- OTP delivery via email
- Async delivery
- Production-ready SMTP

### 💾 Database (PostgreSQL)
- User profile storage
- Organization data
- Membership relationships
- User roles (owner/member)

### ⚡ Cache (Redis)
- OTP storage (hashed)
- Session data
- Rate limiting

---

## Debugging

### See Backend Logs
```bash
cd backend
python main.py
# All errors printed to console
```

### API Documentation
http://localhost:8000/docs (Swagger UI)

### Check Database
```bash
psql workspace_auth
\dt  # List tables
SELECT * FROM "user";
SELECT * FROM organization;
```

### Check Redis
```bash
redis-cli
KEYS *
GET user:otp:user@example.com
```

---

## Next: Secure Secrets

### For Production:
1. Generate strong SECRET_KEY
2. Use environment-specific .env files
3. Enable HTTPS
4. Add database backups
5. Configure firewall rules
6. Use managed services (AWS RDS, ElastiCache)

---

**Ready to go? Start the servers and sign in!** 🚀
