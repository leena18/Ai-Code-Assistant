import os
import io
import faiss
import numpy as np
import pickle
from fastapi import APIRouter, UploadFile, HTTPException, Form
from app.embeddingService.embedding_processor import split_text, get_embedding
from docx import Document  # For handling DOCX files
import PyPDF2  # For handling PDF files

router = APIRouter()

d = 768  # Dimension of Sentence-BERT embeddings

def process_docx(file):
    """Extract text from DOCX files."""
    doc = Document(file)
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])

def process_pdf(file):
    """Extract text from PDF files."""
    reader = PyPDF2.PdfReader(file)
    return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

@router.post("/upload-docs/")
async def upload_documents(
    files: list[UploadFile], 
    project_name: str = Form(...)
):
    """Upload various document formats and save embeddings."""
    
    # Ensure the project-specific folder exists
    project_folder_path = f"./saved_embeddings/{project_name}"
    os.makedirs(project_folder_path, exist_ok=True)

    for file in files:
        # Prepare to store the local index for this file
        local_index = faiss.IndexFlatL2(d)
        text_chunks_store = []  # Local store for text chunks
        tokenized_chunks = []  # Local store for tokenized chunks

        if file.filename.endswith('.docx'):
            file_content = process_docx(io.BytesIO(await file.read()))
        elif file.filename.endswith('.pdf'):
            file_content = process_pdf(io.BytesIO(await file.read()))
        elif file.filename.endswith('.txt'):
            file_content = (await file.read()).decode('utf-8')  # Decode bytes to string
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {file.filename}")

        # Split text into chunks
        doc_chunks = split_text(file_content)

        # Process each text chunk
        for chunk in doc_chunks:
            # Generate embedding for each chunk
            embedding = get_embedding(chunk)
            # Add embeddings to local FAISS index
            local_index.add(np.array([embedding]))

            # Tokenize chunk and store it for BM25
            tokenized_chunk = chunk.split()
            tokenized_chunks.append(tokenized_chunk)
            text_chunks_store.append(chunk)

        # Save embeddings and tokenized chunks for the specific file
        save_embeddings(project_folder_path, file.filename, local_index, text_chunks_store, tokenized_chunks)

    return {"message": "Documents uploaded and processed", "chunks_processed": len(text_chunks_store)}

def save_embeddings(directory, filename, index, text_chunks_store, tokenized_chunks):
    """Save FAISS index and text chunks to disk."""
    # Save the index with filename.index
    faiss.write_index(index, os.path.join(directory, f"{filename}.index"))
    
    # Save the text chunks and tokenized chunks
    with open(os.path.join(directory, f"{filename}_text_chunks_store.pkl"), 'wb') as f:
        pickle.dump(text_chunks_store, f)
    with open(os.path.join(directory, f"{filename}_tokenized_chunks.pkl"), 'wb') as f:
        pickle.dump(tokenized_chunks, f)

