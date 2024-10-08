from fastapi import FastAPI
from app.routers import repository, code_generation, code_fixing, code_document

app = FastAPI(title="AI Coding Assistant API")

# Register routers
app.include_router(repository.router)
app.include_router(code_generation.router)
app.include_router(code_fixing.router)
app.include_router(code_document.router)

# Optional: Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "API is running."}
