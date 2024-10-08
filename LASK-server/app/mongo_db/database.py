import os
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
from pymongo import ASCENDING

# Load environment variables from .env file
load_dotenv()

# Load environment variables or set defaults
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "chat_database")

# Initialize MongoDB client
client = AsyncIOMotorClient(MONGODB_URI)
db = client[DATABASE_NAME]

app = FastAPI()

async def init_db():
    try:
        # Attempt to ping the MongoDB server to verify connection
        await client.admin.command("ping")
        print("Connected to MongoDB")

        # Optionally create an index on session_id to ensure uniqueness
        await db.chat_history.create_index([("session_id", ASCENDING)], unique=True)

    except PyMongoError as e:
        print(f"Error connecting to MongoDB: {e}")

# Start the app and initialize the database connection
@app.on_event("startup")
async def startup_event():
    await init_db()

# Example endpoint (not required for the connection)
@app.get("/")
async def root():
    return {"message": "MongoDB connection test"}
