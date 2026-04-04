import asyncpg
from typing import AsyncGenerator
from app.core.config import settings

class Database:
    pool: asyncpg.Pool = None

db = Database()

async def connect_to_db():
    dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    db.pool = await asyncpg.create_pool(dsn=dsn, min_size=1, max_size=10)
    
    async with db.pool.acquire() as conn:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE
            );
            CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

            CREATE TABLE IF NOT EXISTS organizations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS ix_organizations_slug ON organizations(slug);

            CREATE TABLE IF NOT EXISTS organization_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(32) NOT NULL DEFAULT 'member'
            );
        ''')

async def close_db_connection():
    if db.pool:
        await db.pool.close()

async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    async with db.pool.acquire() as conn:
        yield conn
