from fastapi import APIRouter, UploadFile, HTTPException, Form
from app.embeddingService.embedding_processor import split_text, get_embedding, save_embeddings
from app.embeddingService.bm25_initializer import update_bm25_with_chunks
from app.models.chunk_model import load_text_chunks_store
import os
import zipfile
import io
import faiss
import numpy as np
import pickle

router = APIRouter()

# Load FAISS index
d = 768  # Dimension of embeddings (make sure this matches the embedding model)
index = faiss.IndexFlatL2(d)

text_chunks_store = []  # Store text chunks for retrieval
tokenized_chunks = []  # Tokenized chunks for BM25

@router.post("/upload-file/")
async def upload_file(file: UploadFile, project_name: str = Form(...), user_id: str = Form(...)):
    content = await file.read()
    print(f"Received file: {file.filename} for project: {project_name}")

    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Uploaded file is not a ZIP file")

    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            for zip_info in z.infolist():
                if zip_info.is_dir():
                    continue  # Skip directories

                # Only process text-based files (.java, .py, .php, .js, etc.)
                if not zip_info.filename.endswith(('.java', '.py', '.php', '.js', '.install', 
                                                   '.module', '.info.yml', '.html.twig',
                                                   '.yml', '.css','ts')):
                    print(f"Skipping non-text file: {zip_info.filename}")
                    continue

                # Read file content from the ZIP
                with z.open(zip_info) as f:
                    try:
                        file_content = f.read().decode('utf-8')  # Decode bytes to string
                        text_chunks = split_text(file_content)

                        for chunk in text_chunks:
                            embedding = get_embedding(chunk)

                            # Ensure embedding is a 2D array
                            if embedding.ndim == 1:
                                embedding = np.expand_dims(embedding, axis=0)

                            index.add(embedding)  # Add embeddings to FAISS index

                            tokenized_chunk = chunk.split()
                            tokenized_chunks.append(tokenized_chunk)
                            text_chunks_store.append(chunk)

                            update_bm25_with_chunks([chunk])

                    except UnicodeDecodeError:
                        print(f"Error decoding file: {zip_info.filename}")
                        continue  # Skip files that can't be decoded

        # Ensure the project-specific folder exists
        project_folder_path = f"./saved_embeddings/{project_name}/{user_id}"
        os.makedirs(project_folder_path, exist_ok=True)

        # Save embeddings
        save_embeddings(project_folder_path, index, text_chunks_store, tokenized_chunks)

        return {"message": f"ZIP file uploaded and processed for project {project_name}", "chunks_processed": len(text_chunks_store)}

    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid ZIP file")
    

