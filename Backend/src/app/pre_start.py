import asyncio
import os
import urllib.parse
import asyncpg

async def main():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not set")
        return
    
    dsn = database_url.replace("postgresql+asyncpg://", "postgresql://")
    parsed = urllib.parse.urlparse(dsn)
    db_name = parsed.path.lstrip('/')
    
    if not db_name:
        return
        
    default_dsn = dsn.replace(f"/{db_name}", "/postgres")
    
    # Try to connect and create the database if it doesn't exist
    for _ in range(10):
        try:
            conn = await asyncpg.connect(default_dsn)
            exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", db_name)
            if not exists:
                print(f"Database {db_name} does not exist. Creating...")
                await conn.execute(f'CREATE DATABASE "{db_name}"')
            else:
                print(f"Database {db_name} already exists.")
            await conn.close()
            break
        except Exception as e:
            print(f"Waiting for database to be ready... ({e})")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
