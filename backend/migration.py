import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import Base

# Important: We must import all models here so that they are registered with Base.metadata
from app.models import Organization, OrganizationMember, Form, FormEvent, User

async def migrate():
    print(f"Connecting to database: {settings.database_url}")
    engine = create_async_engine(settings.database_url, future=True, echo=True)
    
    async with engine.begin() as conn:
        print("Dropping all existing tables (if required) and creating new ones...")
        # Be careful with drop_all in production. In this dev script we just ensure create_all
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        print("Database schema migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
