# main.py
from fastapi import FastAPI
from app.routers import question_router, upload_router , upload_doc_router, fetch_repo, initialize_project, sync_repo, loadEmbeddings
from app.mongo_db.database import startup_event
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Code Embedding and Q&A API",
    description="An API for processing code repositories and answering questions using embeddings and AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can specify allowed origins like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(question_router.router, prefix="/api", tags=["Questions"])
app.include_router(upload_router.router, prefix="/api", tags=["Uploads Repo"])
app.include_router(upload_doc_router.router, prefix="/api", tags=["Uploads Doc"])
app.include_router(fetch_repo.router, prefix="/api", tags=["Fetch Repo"])
app.include_router(initialize_project.router, prefix="/api", tags=["Initialize Project"])
app.include_router(sync_repo.router, prefix="/api", tags=["Sync Repo"])
app.include_router(loadEmbeddings.router, prefix="/api", tags=["load and sync embedding"])
# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Code Embedding and Q&A API"}

@app.on_event("startup")
async def on_startup():
    await startup_event()
