from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


class MongoDB:
    client: AsyncIOMotorClient = None


db = MongoDB()


async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    # Ping the database to ensure connection
    await db.client.admin.command("ping")
    print(f"Connected to MongoDB at {settings.mongodb_url}")


async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")


def get_mongo_db():
    return db.client[settings.mongodb_db_name]
