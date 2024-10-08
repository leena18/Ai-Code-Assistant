from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class DirectoryInput(BaseModel):
    directory: str
    user_id: str
    project_id: str
    
    
class QuestionRequest(BaseModel):
    question: str
    project_name: str
    user_id: str
    project_id: str
    
    
class ProjectModel(BaseModel):
    project_name: str
    user_id: str
    project_id: str
    
class CommentRequest(BaseModel):
    code: str
    user_id: str
    project_id: str
    
    
class FixCodeRequest(BaseModel):
    project_name: str
    instruction: str
    faulty_code: str
    user_id: str
    project_id: str
    
class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    user_id: str
    project_id: str

class ChatHistory(BaseModel):
    session_id: str
    project_name: str
    user_id: str
    project_id: str
    history: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
class RepoRequest(BaseModel):
    repo_url: str
    access_token: str = None
    allowed_extensions: list[str] = None
    user_id: str
    project_id: str
    
    
class FilePaths(BaseModel):
    paths: List[str]
    user_id: str
    project_id: str
    ref_repo_name: str
    