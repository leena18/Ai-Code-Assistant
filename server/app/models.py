from pydantic import BaseModel
from typing import Optional

class FixCodeRequest(BaseModel):
    code: str

class RepositoryRequest(BaseModel):
    directory: str

class GenerateCodeRequest(BaseModel):
    instruction: str
    complete: Optional[bool] = False
    
class CodeRequest(BaseModel):
    code: str
