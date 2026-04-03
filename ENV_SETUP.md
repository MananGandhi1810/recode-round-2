# Environment Configuration & Secrets Guide

## Step-by-Step Setup

### 1. Generate Secret Key

```bash
# Generate a secure secret key for JWT signing
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Output example:
# 8J7_K9qZXp-Lm3oN2R5sT4u6v7w8x9yA-B1cD2eF3gH

# Copy this and set as SECRET_KEY in .env
```

### 2. Set Up Resend (Email OTP)

1. Go to https://resend.com
2. Create free account
3. Click "API Keys" in dashboard
4. Copy the API key (starts with `re_`)
5. Add to `backend/.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

6. Go to "Domains" in Resend dashboard
7. Add your domain (or use default resend domain)
8. Verify domain (if using custom domain)
9. Add verified sender email to `.env`:
   ```env
   RESEND_SENDER_EMAIL=noreply@yourdomain.com
   RESEND_SENDER_NAME=Your App Name
   ```

**For Development/Testing:**
- Use the default Resend email: `onboarding@resend.dev`
- Or use a verified email on your custom domain

### 3. Database Setup

#### Option A: Local PostgreSQL

**macOS (Homebrew):**
```bash
# Install
brew install postgresql

# Start service
brew services start postgresql

# Create database
createdb workspace_auth

# Verify
psql workspace_auth
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb workspace_auth
```

**Docker:**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=workspace_auth \
  -p 5432:5432 \
  postgres:16
```

**Update `.env`:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/workspace_auth
```

#### Option B: Managed Database

**PlanetScale (MySQL alternative):**
```env
DATABASE_URL=mysql+aiomysql://user:password@aws.connect.psdb.cloud/db_name?ssl_verify_cert=true
```

**Neon (Postgres managed):**
```env
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxxx.us-east-1.neon.tech/dbname?sslmode=require
```

### 4. Redis Setup

#### Option A: Local Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis

# Verify
redis-cli ping
# Should print: PONG
```

**Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping
```

**Docker:**
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Update `.env`:**
```env
REDIS_URL=redis://localhost:6379/0
```

#### Option B: Managed Redis

**Redis Cloud (free tier):**
1. Sign up at https://app.rediscloud.com
2. Create database
3. Copy connection string: `redis://default:password@cloud.redislabs.com:port`
4. Add to `.env`:
   ```env
   REDIS_URL=redis://default:password@cloud.redislabs.com:port
   ```

**AWS ElastiCache:**
```env
REDIS_URL=redis://endpoint.xxxx.cache.amazonaws.com:6379/0
```

### 5. Complete Backend .env Template

```env
# ============================================
# Server Configuration
# ============================================
PORT=8000
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000

# ============================================
# Security
# ============================================
SECRET_KEY=GENERATED_VALUE_HERE
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ============================================
# Database (PostgreSQL)
# ============================================
# Local:
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/workspace_auth

# Alternative options:
# PlanetScale: mysql+aiomysql://user:pass@host/db
# Neon: postgresql+asyncpg://user:pass@host/db

# ============================================
# Redis (Session & OTP Storage)
# ============================================
# Local:
REDIS_URL=redis://localhost:6379/0

# Cloud:
# Redis Cloud: redis://default:password@host:port
# AWS ElastiCache: redis://endpoint:6379/0

# ============================================
# Email (Resend)
# ============================================
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXX
RESEND_SENDER_EMAIL=noreply@yourdomain.com
RESEND_SENDER_NAME=Your App Name

# Test email (for development):
# RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### 6. Complete Frontend .env.local Template

```env
# API endpoint
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional: For production
# NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

---

## Environment File Locations

```
project-root/
├── backend/
│   ├── .env                    ← Backend secrets
│   ├── main.py
│   └── app/
├── frontend/
│   ├── .env.local              ← Frontend secrets
│   ├── .env.production.local   ← For prod build
│   └── next.config.mjs
└── .env.example                ← Template (optional)
```

---

## Validation Checklist

After updating `.env` files, verify:

### Backend
```bash
cd backend

# 1. Environment loads correctly
python -c "from app.core.config import settings; print('✓ Config loaded')"

# 2. Database connection works
python -c "from app.core.database import engine; print('✓ DB engine created')"

# 3. Redis connection works
python -c "from app.core.redis import redis_client; print(redis_client.ping())"

# 4. All imports work
python -c "from app.main import app; print('✓ App imports OK')"

# 5. Start server
python main.py
# Should show: INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Frontend
```bash
cd frontend

# 1. Environment available in build
cat .env.local

# 2. Start dev server
pnpm dev
# Should show: ▲ Next.js running on http://localhost:3000
```

---

## Troubleshooting

### "RESEND_API_KEY not set"
```bash
# Check .env file
grep RESEND_API_KEY backend/.env

# If empty, get key:
# 1. Visit https://resend.com
# 2. Create account (free)
# 3. Generate API key
# 4. Add to backend/.env
```

### "Database connection refused"
```bash
# Check if PostgreSQL is running
psql -l

# If not, start it:
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Verify connection string in .env
# Format: postgresql+asyncpg://user:password@host:port/database
```

### "Redis connection refused"
```bash
# Check if Redis is running
redis-cli ping

# If not, start it:
brew services start redis  # macOS
redis-server               # Direct

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### "NEXT_PUBLIC_API_BASE_URL not found"
```bash
# Frontend .env must exist
ls frontend/.env.local

# If not, create it:
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > frontend/.env.local

# Next.js requires restart after .env.local changes
# Kill dev server and run: pnpm dev
```

### Frontend can't reach backend
```bash
# 1. Verify backend is running
curl http://localhost:8000/health

# 2. Check frontend .env.local
cat frontend/.env.local

# 3. Verify CORS in backend
# Check app/main.py for allowed origins

# 4. Check browser console for specific errors
# Open DevTools (F12) → Console → Network tab
```

---

## Production Checklist

### Before Deploying

- [ ] **SECRET_KEY**: Generate new with `secrets.token_urlsafe(32)`
- [ ] **RESEND_API_KEY**: Use production API key (not test)
- [ ] **DATABASE_URL**: Use production database (RDS, Neon, etc.)
- [ ] **REDIS_URL**: Use production Redis (ElastiCache, Redis Cloud)
- [ ] **ENVIRONMENT**: Set to `production`
- [ ] **FRONTEND_URL**: Update to production domain
- [ ] **CORS origins**: Update to production domain only (not `*`)
- [ ] **SSL/TLS**: Enable HTTPS with Let's Encrypt
- [ ] **Database backups**: Enable automated backups
- [ ] **Monitoring**: Set up error tracking (Sentry, etc.)

### Example Production .env

```env
PORT=8000
ENVIRONMENT=production
FRONTEND_URL=https://yourdomain.com
SECRET_KEY=STRONG_32_CHAR_KEY_HERE
ACCESS_TOKEN_EXPIRE_MINUTES=60

DATABASE_URL=postgresql+asyncpg://user:pass@db.neon.tech/prod_db?sslmode=require
REDIS_URL=redis://default:password@redis.cloud.host:port

RESEND_API_KEY=re_PRODUCTION_KEY_HERE
RESEND_SENDER_EMAIL=noreply@yourdomain.com
RESEND_SENDER_NAME=Your App
```

---

## Security Best Practices

### Secrets Management
- ✅ Never commit `.env` files to git
- ✅ Add to `.gitignore`: `*.env`, `*.env.local`, `*.env.*.local`
- ✅ Use environment variables in CI/CD
- ✅ Rotate secrets regularly
- ✅ Use password manager for long secrets

### File Permissions
```bash
# Restrict .env file (Linux/macOS)
chmod 600 backend/.env
chmod 600 frontend/.env.local

# Verify
ls -la backend/.env
# Should show: -rw------- (only user can read)
```

### Avoid in Code
- [ ] Never hardcode secrets in source files
- [ ] Never print secrets to logs
- [ ] Never include .env in Docker builds
- [ ] Never share .env in version control

---

## Testing Configuration

### Minimal Dev Setup
```bash
# Docker Compose (all services)
docker-compose up -d

# OR Manual setup
brew services start postgresql
redis-server &

# Create DB
createdb workspace_auth

# Update .env
# Run backend
python backend/main.py

# Run frontend
pnpm -C frontend dev
```

### Test API with curl
```bash
# Health check
curl http://localhost:8000/health

# Request OTP
curl -X POST http://localhost:8000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","full_name":"Test User"}'

# Check OTP in Redis
redis-cli
> KEYS otp:*
> GET otp:challenge:test@example.com
```

---

## Reference: Common Environment Values

### Local Development (Default)
```env
PORT=8000
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/workspace_auth
REDIS_URL=redis://localhost:6379/0
RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### Docker Compose
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/workspace_auth
REDIS_URL=redis://redis:6379/0
```

### AWS Hosted
```env
DATABASE_URL=postgresql+asyncpg://user:pass@prod-rds.amazonaws.com/db
REDIS_URL=redis://prod-elasticache.amazonaws.com:6379/0
```

### Vercel + Neon + Redis Cloud
```env
DATABASE_URL=postgresql+asyncpg://...@ep-xxxx.us-east-1.neon.tech/...
REDIS_URL=redis://default:...@cloud.redislabs.com:...
RESEND_API_KEY=re_xxxx
```

---

## Quick Copy-Paste Templates

### Generate SECRET_KEY
```bash
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

### Template .env for quick setup
```bash
cat > backend/.env << 'EOF'
PORT=8000
ENVIRONMENT=development
SECRET_KEY=REPLACE_WITH_GENERATED_KEY
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/workspace_auth
REDIS_URL=redis://localhost:6379/0
RESEND_API_KEY=re_REPLACE_WITH_YOUR_KEY
RESEND_SENDER_EMAIL=onboarding@resend.dev
RESEND_SENDER_NAME=Test App
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_EXPIRE_MINUTES=60
EOF
```

---

**Environment configured? Check QUICK_START.md to launch!** 🚀
