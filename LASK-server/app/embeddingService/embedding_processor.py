import os
import faiss
import numpy as np
import pickle
from langchain_google_genai import GoogleGenerativeAIEmbeddings

google_api_key = os.getenv("GOOGLE_GENAI_API_KEY")
# Initialize Google Generative AI Embeddings model
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)

# FAISS setup (assuming Google embeddings have a different dimension size)
d = 768  # Adjust this if GoogleGenerativeAIEmbeddings uses a different dimension size
index = faiss.IndexFlatL2(d)
text_chunks_store = []
tokenized_chunks = []

def get_embedding(text):
    """Generate embeddings using GoogleGenerativeAIEmbeddings."""
    # Get embeddings from the Google model
    embeddings = embeddings_model.embed_query(text)
    
    # Ensure the result is a NumPy array of the correct shape
    return np.array(embeddings).reshape(1, -1)

def split_text(text, chunk_size=1000, chunk_overlap=100):
    """Split text into overlapping chunks."""
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]

def save_embeddings(directory, index, text_chunks_store, tokenized_chunks):
    """Save FAISS index and text chunks to disk."""
    faiss.write_index(index, os.path.join(directory, "code_embeddings.index"))
    with open(os.path.join(directory, "text_chunks_store.pkl"), 'wb') as f:
        pickle.dump(text_chunks_store, f)
    with open(os.path.join(directory, "tokenized_chunks.pkl"), 'wb') as f:
        pickle.dump(tokenized_chunks, f)

# Example usage
if __name__ == "__main__":
    sample_text = "This is a test code snippet to generate embeddings."
    embeddings = get_embedding(sample_text)
    print("Generated Embeddings:", embeddings)
    
    # Add embeddings to FAISS index
    index.add(embeddings)
    
    # Save the updated index and embeddings to disk
    save_embeddings("embedding_directory", index, text_chunks_store, tokenized_chunks)