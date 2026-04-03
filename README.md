# Workspace Auth Fullstack Project

This project is a modern fullstack application with a FastAPI backend and a Next.js frontend, managed with `uv` (Python) and `pnpm` (Node.js).

## 🚀 Tech Stack

- **Frontend:** Next.js 15, Tailwind CSS, TypeScript, pnpm
- **Backend:** FastAPI, Python 3.13, uv
- **Database:** PostgreSQL (with SQLAlchemy/asyncpg), MongoDB (with Motor)
- **Cache:** Redis
- **Analytics:** ClickHouse
- **Storage:** RustFS (S3-compatible)

## 📁 Project Structure

```text
.
├── Backend/          # FastAPI Backend (Python 3.13 + uv)
│   ├── src/          # Source code
│   │   ├── app/      # Core application logic
│   │   └── main.py   # Entry point
│   ├── Dockerfile
│   └── pyproject.toml
├── Frontend/         # Next.js Frontend (Node.js 22 + pnpm)
│   ├── app/          # Next.js App Router
│   ├── components/   # UI Components
│   └── Dockerfile
├── docker-compose.yml # Docker infrastructure
├── .env.example       # Environment variables template
└── README.md          # Documentation
```

## 🛠️ Local Development

### 1. Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [pnpm](https://pnpm.io/installation)
- [uv](https://github.com/astral-sh/uv)

### 2. Setup

1. Clone the repository.
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
3. Run the services using Docker:
   ```bash
   docker compose up --build
   ```

## 🐳 Docker Services

The following services are configured in `docker-compose.yml`:

- **backend**: FastAPI application on port 8000.
- **frontend**: Next.js application on port 3000.
- **postgres**: PostgreSQL database for core data.
- **redis**: Redis for caching and session management.
- **mongodb**: MongoDB for flexible form data storage.
- **clickhouse**: ClickHouse for high-performance analytics.
- **rustfs**: RustFS for S3-compatible object storage.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
