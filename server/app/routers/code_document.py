from fastapi import APIRouter, HTTPException
from app.groq_client import generate_code_documentation
from app.models import CodeRequest

# Create a router for code documentation endpoints
router = APIRouter()

@router.post("/generate-documentation")
async def generate_documentation(request: CodeRequest):
    try:
        documentation = generate_code_documentation(request.code)
        return {"documentation": documentation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    