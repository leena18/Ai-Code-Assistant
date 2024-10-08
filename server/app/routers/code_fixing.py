from fastapi import APIRouter, HTTPException
from app.models import FixCodeRequest
from app.groq_client import fix_code_syntax

router = APIRouter()

@router.post("/fix_code")
def api_fix_code(request: FixCodeRequest):
    if not request.code:
        raise HTTPException(status_code=400, detail="Code is required.")
    fixed_code = fix_code_syntax(request.code)
    return {"fixed_code": fixed_code}
