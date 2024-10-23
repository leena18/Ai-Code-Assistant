import os
import faiss
import numpy as np
import pickle
import asyncio
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from typing import List, Dict, Any
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from fastapi import BackgroundTasks


router = APIRouter()

# Initialize Google Generative AI Embeddings model
google_api_key = os.getenv("GOOGLE_GENAI_API_KEY")
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)

# FAISS index and storage directories
INDEX_FILE_PATH = "code_embeddings.index"
TEXT_CHUNKS_STORE_PATH = "text_chunks_store.pkl"
TOKENIZED_CHUNKS_PATH = "tokenized_chunks.pkl"
d = 768  # Adjust if GoogleGenerativeAIEmbeddings uses a different dimension size

# Global stores
text_chunks_store: List[Dict[str, Any]] = []
tokenized_chunks: List[str] = []

# Load the existing FAISS index or create a new one
if os.path.exists(INDEX_FILE_PATH):
    index = faiss.read_index(INDEX_FILE_PATH)
else:
    index = faiss.IndexFlatL2(d)

# Load the stored chunks (if they exist)
if os.path.exists(TEXT_CHUNKS_STORE_PATH):
    with open(TEXT_CHUNKS_STORE_PATH, 'rb') as f:
        text_chunks_store = pickle.load(f)

if os.path.exists(TOKENIZED_CHUNKS_PATH):
    with open(TOKENIZED_CHUNKS_PATH, 'rb') as f:
        tokenized_chunks = pickle.load(f)
        
def load_or_create_index_and_chunks(INDEX_FILE_PATH: str, TEXT_CHUNKS_STORE_PATH: str, TOKENIZED_CHUNKS_PATH: str):
    """
    Function to load or create FAISS index, text chunks store, and tokenized chunks.

    Args:
        INDEX_FILE_PATH (str): Path to the FAISS index file.
        TEXT_CHUNKS_STORE_PATH (str): Path to the text chunks store file.
        TOKENIZED_CHUNKS_PATH (str): Path to the tokenized chunks file.

    Returns:
        index (faiss.Index): Loaded or newly created FAISS index.
        text_chunks_store (list): Loaded or empty list of text chunks.
        tokenized_chunks (list): Loaded or empty list of tokenized chunks.
    """

    # Load the existing FAISS index or create a new one
    if os.path.exists(INDEX_FILE_PATH):
        index = faiss.read_index(INDEX_FILE_PATH)
        print(f"Loaded existing FAISS index from {INDEX_FILE_PATH}")
    else:
        d = 768  # Assuming the dimensionality of embeddings is 768, adjust if different
        index = faiss.IndexFlatL2(d)
        print(f"Created a new FAISS index with dimensionality {d}")

    # Load the stored chunks (if they exist)
    if os.path.exists(TEXT_CHUNKS_STORE_PATH):
        with open(TEXT_CHUNKS_STORE_PATH, 'rb') as f:
            text_chunks_store = pickle.load(f)
        print(f"Loaded text chunks store from {TEXT_CHUNKS_STORE_PATH}")
    else:
        text_chunks_store = []
        print(f"No text chunks store found, initialized an empty list")

    # Load the tokenized chunks (if they exist)
    if os.path.exists(TOKENIZED_CHUNKS_PATH):
        with open(TOKENIZED_CHUNKS_PATH, 'rb') as f:
            tokenized_chunks = pickle.load(f)
        print(f"Loaded tokenized chunks from {TOKENIZED_CHUNKS_PATH}")
    else:
        tokenized_chunks = []
        print(f"No tokenized chunks found, initialized an empty list")

    return index, text_chunks_store, tokenized_chunks

# Semaphore to limit concurrent embedding generation
embedding_semaphore = asyncio.Semaphore(3)  # Allow 3 concurrent embedding generation tasks

async def get_embedding(text: str) -> np.ndarray:
    """Generate embeddings using GoogleGenerativeAIEmbeddings."""
    embeddings = embeddings_model.embed_query(text)
    return np.array(embeddings).reshape(1, -1)

def split_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks."""
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]

import os
import pickle
import faiss

def save_embeddings():
    """Save FAISS index and text chunks to disk, ensuring directories exist."""
    
    # Ensure directory for INDEX_FILE_PATH exists
    index_dir = os.path.dirname(INDEX_FILE_PATH)
    if not os.path.exists(index_dir):
        os.makedirs(index_dir)
    
    # Save FAISS index
    faiss.write_index(index, INDEX_FILE_PATH)
    
    # Ensure directory for TEXT_CHUNKS_STORE_PATH exists
    text_chunks_store_dir = os.path.dirname(TEXT_CHUNKS_STORE_PATH)
    if not os.path.exists(text_chunks_store_dir):
        os.makedirs(text_chunks_store_dir)
    
    # Save text chunks store
    with open(TEXT_CHUNKS_STORE_PATH, 'wb') as f:
        pickle.dump(text_chunks_store, f)
    
    # Ensure directory for TOKENIZED_CHUNKS_PATH exists
    tokenized_chunks_dir = os.path.dirname(TOKENIZED_CHUNKS_PATH)
    if not os.path.exists(tokenized_chunks_dir):
        os.makedirs(tokenized_chunks_dir)
    
    # Save tokenized chunks
    with open(TOKENIZED_CHUNKS_PATH, 'wb') as f:
        pickle.dump(tokenized_chunks, f)


async def process_embeddings(file_path: str, contents: str):
    """Process the embeddings."""
    async with embedding_semaphore:
        try:
            # Split the file content into chunks
            chunks = split_text(contents)

            # Process chunks
            for chunk in chunks:
                embedding = await get_embedding(chunk)  # Await the embedding generation
                index.add(embedding)

                # Store the chunk and its corresponding file path
                text_chunks_store.append({"file_path": file_path, "chunk": chunk})
                tokenized_chunks.append(chunk)

            # Save the updated embeddings and chunks
            save_embeddings()

        except Exception as e:
            print(f"Error processing embeddings: {e}")


@router.post("/generate-repo-embedding")
async def generate_repo_embedding(
    userId: str = Form(...),
    projectId: str = Form(...),
    file_path: str = Form(...),
    file: UploadFile = File(...)
):
    """Endpoint to generate embeddings for a file asynchronously."""
    try:
        # Read file content and file path
        contents = (await file.read()).decode("utf-8")
        global INDEX_FILE_PATH, TEXT_CHUNKS_STORE_PATH, TOKENIZED_CHUNKS_PATH
        INDEX_FILE_PATH = f"./project_contexts/{projectId}/{userId}/code_embeddings.index"
        TEXT_CHUNKS_STORE_PATH = f"./project_contexts/{projectId}/{userId}/text_chunks_store.pkl"
        TOKENIZED_CHUNKS_PATH = f"./project_contexts/{projectId}/{userId}/tokenized_chunks.pkl"
        
        # Check if this file already has embeddings (for idempotency)
        existing_embeddings = [item for item in text_chunks_store 
                               if item['file_path'] == file_path and item['userId'] == userId and item['projectId'] == projectId]
        
        if existing_embeddings:
            return {"status": "exists", "message": f"Embeddings already exist for file: {file_path}, user: {userId}, project: {projectId}"}

        # Process the embedding generation in the background
        await process_embeddings(file_path, contents)

        return {"status": "processing", "message": f"Embeddings are being generated for file: {file_path}, user: {userId}, project: {projectId}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
    
    
syncing_semaphore = asyncio.Semaphore(3)  # Limit to 3 concurrent sync operations


async def process_embeddings_background(file_path: str, contents: str, userId: str, projectId: str):
    """Process the embeddings in the background."""
    await process_embeddings(file_path, contents)
    print(f"Embeddings updated for file: {file_path}, user: {userId}, project: {projectId}")

@router.post("/sync-repo-embedding")
async def sync_repo_embedding(
    userId: str = Form(...),
    projectId: str = Form(...),
    file_path: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks() 
):
    """Endpoint to sync embeddings asynchronously using BackgroundTasks."""
    try:
        # Read the new file content
        contents = (await file.read()).decode("utf-8")

        global INDEX_FILE_PATH, TEXT_CHUNKS_STORE_PATH, TOKENIZED_CHUNKS_PATH, text_chunks_store, index, tokenized_chunks
        INDEX_FILE_PATH = f"./project_contexts/{projectId}/{userId}/code_embeddings.index"
        TEXT_CHUNKS_STORE_PATH = f"./project_contexts/{projectId}/{userId}/text_chunks_store.pkl"
        TOKENIZED_CHUNKS_PATH = f"./project_contexts/{projectId}/{userId}/tokenized_chunks.pkl"

        # Load or create index and chunks
        index, text_chunks_store, tokenized_chunks = load_or_create_index_and_chunks(INDEX_FILE_PATH, TEXT_CHUNKS_STORE_PATH, TOKENIZED_CHUNKS_PATH)

        # Check if this file already has embeddings and remove old ones if needed
        if find_and_remove_old_embeddings(file_path):
            # Add to background tasks to be processed asynchronously
            background_tasks.add_task(process_embeddings_background, file_path, contents, userId, projectId)
            return {"status": "processing", "message": f"Embeddings are being updated for file: {file_path}, user: {userId}, project: {projectId}"}
        else:
            return {"status": "failed", "message": f"No embeddings found for file: {file_path}, user: {userId}, project: {projectId}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

def find_and_remove_old_embeddings(file_path: str) -> bool:
    """Find and remove old embeddings for a specific file."""
    print("finding and removing old embeddings")
    global text_chunks_store
    
    to_remove = []
    
    # Identify chunks to remove based on file path
    for i, item in enumerate(text_chunks_store):
        if item['file_path'] == file_path:
            to_remove.append(i)

    # Remove vectors from FAISS and keep track of indices to delete
    if to_remove:
        index.remove_ids(np.array(to_remove).astype(np.int64))
        # Remove the entries from the text_chunks_store
        text_chunks_store = [item for i, item in enumerate(text_chunks_store) if i not in to_remove]
        return True
    return False

@router.post("/other-api-endpoint")
async def other_api_endpoint():
    """Handle other APIs with dedicated threads."""
    return {"status": "success", "message": "This is a response from another API."}
