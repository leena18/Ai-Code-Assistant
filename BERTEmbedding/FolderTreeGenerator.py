import os
import zipfile
import streamlit as st
import tempfile
import faiss
import numpy as np
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from groq import Groq  # Replace with actual Groq import
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Google Generative AI Embeddings model with API key
google_api_key = os.getenv("GOOGLE_GENAI_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)

# Globals
faiss_index_file = "faiss_index.index"

def extract_zip(zip_file, extract_to):
    """Extract the zip file to a specified directory."""
    with zipfile.ZipFile(zip_file, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

def list_files(startpath, extensions=(".java", ".xml",".php",".js",".py",".info.yml",".yml",".twig",".css",".js","libraries.yml",".po",".sql","composer.json","package.json",".html.twig",".install",".module",".ts",".test",".schema.yml")):
    """Recursively return the directory structure as a string, including only specified file types and skipping empty folders."""
    structure = ""

    # Helper function to check if a directory contains any valid files
    def has_valid_files(path):
        for root, dirs, files in os.walk(path):
            for f in files:
                if f.endswith(extensions):
                    return True
        return False

    for root, dirs, files in os.walk(startpath):
        if not has_valid_files(root):  # Skip empty folders
            continue

        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * level
        structure += f'{indent}{os.path.basename(root)}/\n'
        subindent = ' ' * 4 * (level + 1)

        for f in files:
            if f.endswith(extensions):
                structure += f'{subindent}{f}\n'

    return structure

def generate_embeddings(text, model):
    """Generate embeddings for the given text using the provided model."""
    embeddings = model.embed_query(text)
    return embeddings

def create_faiss_index(embedding_vectors):
    """Create and return a FAISS index from the embedding vectors."""
    embedding_dim = len(embedding_vectors[0])
    index = faiss.IndexFlatL2(embedding_dim)  # FAISS index
    embedding_vectors_np = np.array(embedding_vectors).astype('float32')
    index.add(embedding_vectors_np)
    return index

def save_faiss_index(index, filepath):
    """Save FAISS index to the specified filepath."""
    faiss.write_index(index, filepath)

def load_faiss_index(filepath):
    """Load FAISS index from the specified filepath."""
    if os.path.exists(filepath):
        return faiss.read_index(filepath)
    return None

def query_faiss_index(index, query_embedding, k=1):
    """Query the FAISS index and return the closest matches."""
    query_embedding = np.array(query_embedding).astype('float32').reshape(1, -1)
    distances, indices = index.search(query_embedding, k)
    return distances, indices

# Streamlit application
st.title("Repository Tree Structure from ZIP File and FAISS Index Creation")

# Load FAISS index if it exists
if 'faiss_index' not in st.session_state:
    st.session_state.faiss_index = load_faiss_index(faiss_index_file)

# Step 1: Upload ZIP file
uploaded_file = st.file_uploader("Upload a ZIP file containing a repository", type="zip")

if uploaded_file is not None:
    # Step 2: Extract the uploaded file to a temporary directory
    with tempfile.TemporaryDirectory() as tmp_dir:
        extract_zip(uploaded_file, tmp_dir)
        
        # Step 3: Display the tree structure
        st.write("### Repository Tree Structure:")
        repo_structure = list_files(tmp_dir)
        st.text(repo_structure)

        # Step 4: Generate embeddings
        if st.button("Generate Embeddings and Create FAISS Index"):
            with st.spinner("Generating embeddings and creating FAISS index..."):
                # Generate embeddings for the directory structure
                embeddings = generate_embeddings(repo_structure, embeddings_model)
                
                # Convert to list (if needed, depending on the embedding model's output)
                if not isinstance(embeddings, list):
                    embeddings = embeddings.tolist()

                # Step 5: Create FAISS index and store it in session state
                faiss_index = create_faiss_index([embeddings])
                save_faiss_index(faiss_index, faiss_index_file)
                st.session_state.faiss_index = faiss_index  # Store in session state
                st.success("FAISS index created and saved successfully!")
                
                # Step 6: Allow FAISS index download
                with open(faiss_index_file, "rb") as f:
                    st.download_button(
                        label="Download FAISS Index",
                        data=f,
                        file_name="faiss_index.index",
                        mime="application/octet-stream"
                    )

# Step 7: Query the FAISS index
if st.session_state.faiss_index is not None:
    st.write("### Query the FAISS Index")
    query_text = st.text_input("Enter your query:")
    
    if query_text and st.button("Query FAISS"):
        # Generate embeddings for the query
        query_embedding = generate_embeddings(query_text, embeddings_model)
        
        # Search the FAISS index
        distances, indices = query_faiss_index(st.session_state.faiss_index, query_embedding)
        
        # Display the retrieved information
        st.write(f"Closest match distance: {distances[0][0]}")

