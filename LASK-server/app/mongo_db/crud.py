# crud.py

from .database import db
from app.models.models import ChatHistory, Message
from typing import Optional

async def save_chat_history(chat_history: ChatHistory):
    """
    Save or update chat history in the database.
    """
    await db.chat_history.update_one(
        {"session_id": chat_history.session_id},
        {
            "$set": {
                "project_name": chat_history.project_name,
                "history": [message.dict() for message in chat_history.history],
                "updated_at": chat_history.updated_at
            }
        },
        upsert=True
    )

async def load_chat_history(session_id: str) -> Optional[ChatHistory]:
    """
    Load chat history from the database by session_id.
    """
    chat_data = await db.chat_history.find_one({"session_id": session_id})
    print(chat_data)
    if chat_data:
        return ChatHistory(
            session_id=chat_data["session_id"],
            project_name=chat_data.get("project_name", ""),
            history=[Message(**msg) for msg in chat_data.get("history", [])],
            updated_at=chat_data.get("updated_at")
        )
    return None


