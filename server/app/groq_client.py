import os
import numpy as np
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from groq import Groq
import faiss
from dotenv import load_dotenv
import pickle

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

# Function to generate embeddings using Google Generative AI
def get_embedding(text: str) -> np.ndarray:
    embedding = embeddings.embed_documents([text])[0]
    return np.array(embedding)

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

# Function to generate code with context from embeddings and Groq API
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
Code context is also provided however it is not necessary that the code instructions are based on context.
Do not include any explanations, comments, or extra text. Return only the code and nothing else.

Instruction: {instruction}

Context: {context}

Code:
"""
    else:
        prompt_template = f"""
You are an AI assistant. Generate/complete the given code and return the refined code only.
Do not include any explanations, comments, or extra text. Return only the code and nothing else.

code: {instruction}
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

# Function to generate comments for code using Groq API
def generate_code_comments(code: str) -> str:
    prompt = f"""
You are an AI assistant specialized in adding comments to code. 
Given the following code, add meaningful comments explaining its functionality. Return only the commented code without any explanations or extra text.

Code to comment:
{code}

Commented Code:
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
    
    commented_code = ""
    for chunk in completion:
        commented_code += chunk.choices[0].delta.content or ""
    
    return commented_code.strip()


# Function to generate documentation for code using Groq API
def generate_code_documentation(code: str) -> str:
    prompt = f"""
You are an AI assistant specializing in generating comprehensive documentation for code. 
Given the following code, generate detailed documentation including descriptions of the functions, variables, and overall functionality. 
The documentation should be in a format that is easy to understand and follow. Only return the documentation and nothing else.

Code to document:
{code}

Documentation:
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
    
    documentation = ""
    for chunk in completion:
        documentation += chunk.choices[0].delta.content or ""
    
    return documentation.strip()

