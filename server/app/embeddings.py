import os
import pickle
import numpy as np
import faiss
from langchain_google_genai import GoogleGenerativeAIEmbeddings


# Define the FAISS index and storage file path
EMBEDDINGS_FILE_PATH = 'embeddings.pkl'
FAISS_INDEX_PATH = 'faiss_index.idx'
LOADED_EMBEDDINGS = None
LOADED_TEXT_CHUNKS_STORE = None

# Initialize FAISS index for vector storage
D = 768  # Dimension of embeddings
INDEX = faiss.IndexFlatL2(D)  # L2 distance index for cosine similarity

# Initialize GoogleGenerativeAIEmbeddings
GOOGLE_API_KEY = os.getenv("GOOGLE_GENAI_API_KEY")
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)

# Function to generate embeddings using Google Generative AI
def get_embedding(text: str) -> np.ndarray:
    embedding = embeddings.embed_documents([text])[0]
    return np.array(embedding)

# Function to save embeddings
def save_embeddings_to_file(embeddings: list, text_chunks_store: list, file_path: str = EMBEDDINGS_FILE_PATH):
    data = [{'chunk': chunk_data[0], 'file_name': chunk_data[1], 'embedding': embedding}
            for embedding, chunk_data in zip(embeddings, text_chunks_store)]
    with open(file_path, 'wb') as pkl_file:
        pickle.dump(data, pkl_file)
    print(f"Embeddings stored successfully in {file_path}.")

# Function to load embeddings from file
import os
import faiss
import pickle
import numpy as np

# Load FAISS index and embeddings
def load_embeddings():
    if not os.path.exists(FAISS_INDEX_PATH):
        raise ValueError("FAISS index not found. Please process the repository first.")
    
    if not os.path.exists(EMBEDDINGS_FILE_PATH):
        raise ValueError("Embeddings file not found. Please process the repository first.")
    
    # Load FAISS index
    index = faiss.read_index(FAISS_INDEX_PATH)
    
    # Load text chunks and file paths from pickle
    with open(EMBEDDINGS_FILE_PATH, 'rb') as f:
        embeddings_data = pickle.load(f)
    
    return index, embeddings_data

