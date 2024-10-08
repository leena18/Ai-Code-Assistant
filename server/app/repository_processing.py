import os
import pickle
import numpy as np
import faiss
from app.embeddings import get_embedding, save_embeddings_to_file

# Define the FAISS index and storage file path
EMBEDDINGS_FILE_PATH = 'embeddings.pkl'
FAISS_INDEX_PATH = 'faiss_index.idx'
D = 768  # Adjust this based on the dimension of your embedding model
INDEX = faiss.IndexFlatL2(D)

# Split text into chunks
def split_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 100):
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return text_splitter.split_text(text)

# Process files in a repository, generate embeddings, and save to FAISS index
def process_repository(directory: str):
    supported_extensions = ['.java', '.js', '.py', '.php', '.cpp']
    all_embeddings = []
    all_text_chunks_store = []

    # Check if FAISS index exists, if so, load it
    if os.path.exists(FAISS_INDEX_PATH):
        INDEX = faiss.read_index(FAISS_INDEX_PATH)

    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.splitext(file)[1] in supported_extensions:
                with open(file_path, 'r', encoding='utf-8') as f:
                    file_content = f.read()
                text_chunks = split_text(file_content)
                for chunk in text_chunks:
                    embedding = get_embedding(chunk)
                    all_embeddings.append(embedding)
                    all_text_chunks_store.append((chunk, file_path))
    
    # Convert embeddings to numpy array and add to FAISS index
    embeddings_np = np.array(all_embeddings).astype('float32')
    INDEX.add(embeddings_np)
    
    # Save FAISS index to disk
    faiss.write_index(INDEX, FAISS_INDEX_PATH)
    
    # Save embeddings and text chunks to pickle for future use
    save_embeddings_to_file(all_embeddings, all_text_chunks_store)

# Summarize repository's content using Groq
def summarize_repository(directory: str) -> str:
    context = ""
    supported_extensions = ['.java', '.js', '.py', '.php', '.cpp']
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.splitext(file)[1] in supported_extensions:
                with open(file_path, 'r', encoding='utf-8') as f:
                    context += f"File: {file}\n{f.read()}\n\n"
    
    # Send summary request to Groq API
    prompt = f"Summarize the following code repository:\n{context}\nSummary:"
    completion = groq_client.chat.completions.create(
        model="gemma-7b-it",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True
    )
    
    return "".join(chunk.choices[0].delta.content or "" for chunk in completion)
