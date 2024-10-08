import os
import faiss
import numpy as np
import pickle
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from groq import Groq

# Initialize FastAPI app
app = FastAPI(title="AI Coding Assistant API")

# Load environment variables
load_dotenv()

# Fetch API keys from environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_GENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Validate API keys
if not GOOGLE_API_KEY:
    raise EnvironmentError("Google GenAI API key not found. Please set the 'GOOGLE_GENAI_API_KEY' environment variable.")
if not GROQ_API_KEY:
    raise EnvironmentError("Groq API key not found. Please set the 'GROQ_API_KEY' environment variable.")

# Initialize GoogleGenerativeAIEmbeddings and Groq client
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

# Initialize FAISS index for vector storage
D = 768  # Dimension of embeddings (adjust based on your model)
INDEX = faiss.IndexFlatL2(D)  # L2 distance index for cosine similarity

# Initialize storage variables
EMBEDDINGS_FILE_PATH = 'embeddings.pkl'
LOADED_EMBEDDINGS = None
LOADED_TEXT_CHUNKS_STORE = None

# Load embeddings if the pickle file exists
if os.path.exists(EMBEDDINGS_FILE_PATH):
    with open(EMBEDDINGS_FILE_PATH, 'rb') as pkl_file:
        data = pickle.load(pkl_file)
    LOADED_EMBEDDINGS = np.array([item['embedding'] for item in data])
    LOADED_TEXT_CHUNKS_STORE = [(item['chunk'], item['file_name']) for item in data]
    INDEX.add(LOADED_EMBEDDINGS)
    print(f"Loaded {len(LOADED_EMBEDDINGS)} embeddings from {EMBEDDINGS_FILE_PATH}")

# Pydantic models for request bodies

# added for code fixing 

class FixCodeRequest(BaseModel):
    code: str

    # ---------------------------other working methods 

class RepositoryRequest(BaseModel):
    directory: str

class GenerateCodeRequest(BaseModel):
    instruction: str
    complete: Optional[bool] = False

# Function to generate embeddings using Google Generative AI


# code fixing 

# Function to fix syntax issues using Groq API
def fix_code_syntax(code: str) -> str:
    prompt = f"""
You are an AI assistant specializing in fixing code syntax errors. 
Given the following code, return the corrected version without any explanations or comments. Only return the fixed code.

Code to fix:
{code}

Corrected Code:
"""
    completion = groq_client.chat.completions.create(
        model="gemma-7b-it",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=["Explanation", "Comment"]
    )
    
    fixed_code = ""
    for chunk in completion:
        fixed_code += chunk.choices[0].delta.content or ""
    
    return fixed_code.strip()

    # ---------------------------other working methods


def get_embedding(text: str) -> np.ndarray:
    embedding = embeddings.embed_documents([text])[0]
    return np.array(embedding)


# Function to split text into manageable chunks
def split_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 100) -> list:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return text_splitter.split_text(text)


# Save embeddings to local storage as Pickle file
def save_embeddings_to_file(embeddings: list, text_chunks_store: list, file_path: str = EMBEDDINGS_FILE_PATH):
    data = []
    for embedding, chunk_data in zip(embeddings, text_chunks_store):
        data.append({
            'chunk': chunk_data[0],
            'file_name': chunk_data[1],
            'embedding': embedding
        })
    with open(file_path, 'wb') as pkl_file:
        pickle.dump(data, pkl_file)
    print(f"Embeddings stored successfully in {file_path}.")

# Load embeddings from Pickle file
def load_embeddings_from_file(file_path: str = EMBEDDINGS_FILE_PATH):
    global LOADED_EMBEDDINGS, LOADED_TEXT_CHUNKS_STORE
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Embeddings file '{file_path}' not found.")
    with open(file_path, 'rb') as pkl_file:
        data = pickle.load(pkl_file)
    LOADED_EMBEDDINGS = np.array([item['embedding'] for item in data])
    LOADED_TEXT_CHUNKS_STORE = [(item['chunk'], item['file_name']) for item in data]
    INDEX.add(LOADED_EMBEDDINGS)
    print(f"Loaded {len(LOADED_EMBEDDINGS)} embeddings from {file_path}")

# Recursive function to process files in a directory (repository)
def process_repository(directory: str):
    supported_extensions = ['.java', '.js', '.py', '.php', '.cpp']
    all_embeddings = []
    all_text_chunks_store = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            file_ext = os.path.splitext(file)[1]
            if file_ext in supported_extensions:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        file_content = f.read()
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")
                    continue
                text_chunks = split_text(file_content)
                for chunk in text_chunks:
                    file_embedding = get_embedding(chunk)
                    all_embeddings.append(file_embedding)
                    all_text_chunks_store.append((chunk, file_path))
    if all_embeddings:
        save_embeddings_to_file(all_embeddings, all_text_chunks_store)
        INDEX.add(np.array(all_embeddings))
        print(f"Processed repository '{directory}' with {len(all_embeddings)} chunks.")
    else:
        raise ValueError("No valid files found in the directory to process.")

# Function to summarize repository content using Groq API
def summarize_repository(directory: str) -> str:
    supported_extensions = ['.java', '.js', '.py', '.php', '.cpp']
    context = ""
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            file_ext = os.path.splitext(file)[1]
            if file_ext in supported_extensions:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        file_content = f.read()
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")
                    continue
                context += f"File: {file}\n{file_content}\n\n"
    if not context:
        raise ValueError("No valid files found in the directory to summarize.")
    
    prompt = f"Summarize the following code repository:\n{context}\nSummary:"
    completion = groq_client.chat.completions.create(
        model="gemma-7b-it",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True
    )
    summary = ""
    for chunk in completion:
        summary += chunk.choices[0].delta.content or ""
    return summary.strip()



# Function to generate code with context from embeddings and Groq API
# generation and completion are both in same
# just the difference in the parameter of true and false
def generate_code_with_context(instruction: str, complete: bool = False) -> str:
    if LOADED_EMBEDDINGS is None or LOADED_TEXT_CHUNKS_STORE is None:
        raise ValueError("Embeddings not loaded. Please process a repository first.")
    
    instruction_embedding = get_embedding(instruction)
    k = 5  # Number of neighbors to retrieve for context
    distances, context_indices = INDEX.search(np.array([instruction_embedding]), k)
    
    context = ""
    for idx in context_indices[0]:
        if idx < len(LOADED_TEXT_CHUNKS_STORE):
            context += LOADED_TEXT_CHUNKS_STORE[idx][0] + "\n"
    
    if not complete:
        prompt_template = f"""
You are an AI assistant. Generate only the refined code based on the following instruction in the asked language. 
Do not include any explanations, comments, or extra text. Return only the code and nothing else.

Instruction: {instruction}

Context: {context}

Code:
"""
    else:
        prompt_template = f"""
You are an AI assistant. Generate/complete the given code based on the following instruction in the asked language. 
Do not include any explanations, comments, or extra text. Return only the code and nothing else.

Instruction: {instruction}
Complete the above code.
Context: {context}

Code:
"""
    
    completion = groq_client.chat.completions.create(
        model="gemma-7b-it",
        messages=[{"role": "user", "content": prompt_template}],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=["Explanation", "Comment"]
    )
    
    generated_code = ""
    for chunk in completion:
        generated_code += chunk.choices[0].delta.content or ""
    
    return generated_code.strip()



# API Endpoints----------------------------

@app.post("/process_repository")
def api_process_repository(request: RepositoryRequest):
    directory = request.directory
    if not os.path.isdir(directory):
        raise HTTPException(status_code=400, detail=f"Directory '{directory}' does not exist.")
    try:
        process_repository(directory)
        return {"message": f"Repository '{directory}' processed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize_repository")
def api_summarize_repository(request: RepositoryRequest):
    directory = request.directory
    if not os.path.isdir(directory):
        raise HTTPException(status_code=400, detail=f"Directory '{directory}' does not exist.")
    try:
        summary = summarize_repository(directory)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_code")
def api_generate_code(request: GenerateCodeRequest):
    instruction = request.instruction
    complete = request.complete
    if not instruction:
        raise HTTPException(status_code=400, detail="Instruction is required.")
    try:
        code = generate_code_with_context(instruction, complete)
        return {"generated_code": code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Optional: Endpoint to load embeddings manually
@app.post("/load_embeddings")
def api_load_embeddings(request: RepositoryRequest):
    file_path = EMBEDDINGS_FILE_PATH
    try:
        load_embeddings_from_file(file_path)
        return {"message": f"Embeddings loaded successfully from '{file_path}'."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Optional: Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "API is running."}

    # --------------------------------

# API endpoint for code syntax fixing
@app.post("/fix_code_syntax")
def api_fix_code_syntax(request: FixCodeRequest):
    code = request.code
    if not code:
        raise HTTPException(status_code=400, detail="Code input is required.")
    
    try:
        fixed_code = fix_code_syntax(code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error while fixing code: {str(e)}")
    
    return {"fixed_code": fixed_code}
