from fastapi import APIRouter, HTTPException
from app.models import GenerateCodeRequest
from app.groq_client import generate_code_with_context, generate_code_comments

router = APIRouter()

@router.post("/generate_code")
def api_generate_code(request: GenerateCodeRequest):
    if not request.instruction:
        raise HTTPException(status_code=400, detail="Instruction is required.")
    code = generate_code_with_context(request.instruction, request.complete)
    return {"generated_code": code}

@router.post("/generate_comments")
def api_generate_comments(request: GenerateCodeRequest):
    if not request.instruction:
        raise HTTPException(status_code=400, detail="Code is required.")
    comments = generate_code_comments(request.instruction)
    return {"commented_code": comments}
