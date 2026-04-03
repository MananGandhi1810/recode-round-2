# FormBar

FormBar is a modern, full-stack application for building and managing forms, featuring a FastAPI backend and a Next.js frontend.

## Architecture

- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS.
- **Backend**: FastAPI (Python 3.13) with SQLAlchemy (PostgreSQL), Redis (OTP/Caching), and Motor (MongoDB).
- **Infrastructure**: Docker Compose manages multiple services including PostgreSQL, Redis, MongoDB, ClickHouse, and RustFS.

## Local Development

### Prerequisites

- Docker and Docker Compose
- Node.js (for local linting/types)
- Python 3.13 (for local development)

### Getting Started

1. Clone the repository.
2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Start the services using Docker Compose:
   ```bash
   docker compose up --build
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Hot-Reloading

Both the frontend and backend are configured for hot-reloading:
- **Backend**: Source code is mounted from `./Backend/src`. Changes trigger a Uvicorn reload.
- **Frontend**: The entire `./Frontend` directory is mounted. Next.js Turbopack handles fast refreshes.

## Service Ports

- Frontend: 3000
- Backend API: 8000
- PostgreSQL: 5432
- Redis: 6379
- MongoDB: 27017
- ClickHouse: 8123, 9000
- RustFS: 9001 (Console), 9002 (API)

## Backend Structure

- `app/core`: Configuration, database engines, and security.
- `app/models`: SQLAlchemy and Pydantic models.
- `app/routers`: FastAPI route definitions.
- `app/services`: Business logic and third-party integrations.
- `app/schemas`: Data validation schemas.
