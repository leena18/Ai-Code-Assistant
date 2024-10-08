import streamlit as st
import os
import torch
from sentence_transformers import SentenceTransformer  # Import SentenceTransformer
import faiss
import numpy as np
from rank_bm25 import BM25Okapi  # Import BM25 for keyword search
from transformers import AutoTokenizer, AutoModelForCausalLM  # Import Qwen model components

# Load the Qwen model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-Coder-1.5B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Coder-1.5B")

# Load the Sentence-BERT model for embeddings
embedding_model = SentenceTransformer('sentence-transformers/msmarco-roberta-base-ance-firstp')

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Initialize FAISS index for vector storage
d = 768  # Dimension of Sentence-BERT embeddings
index = faiss.IndexFlatL2(d)  # L2 distance index for cosine similarity

# Initialize text_chunks_store in session state
if 'text_chunks_store' not in st.session_state:
    st.session_state['text_chunks_store'] = []
if 'bm25' not in st.session_state:
    st.session_state['bm25'] = None  # BM25 model for keyword search

# Function to generate embeddings using Sentence-BERT
def get_embedding(text):
    return embedding_model.encode(text)  # Directly use the Sentence-BERT model

# Function to split code files into chunks
def split_text(text, chunk_size=1000, chunk_overlap=100):
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]

# Function to process the files in the selected directory and show progress
def process_files_in_directory(directory):
    files_to_process = []
    
    # Collect all the files with the desired extensions
    for subdir, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.java', '.py', '.php', '.js')):
                files_to_process.append(os.path.join(subdir, file))
    
    total_files = len(files_to_process)
    progress = st.progress(0)  # Initialize the progress bar
    tokenized_chunks = []  # Store tokenized chunks for BM25

    for i, file_path in enumerate(files_to_process):
        st.write(f"Processing file {i+1}/{total_files}: {file_path}")
        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()
            text_chunks = split_text(file_content)
            for chunk in text_chunks:
                embedding = get_embedding(chunk)
                index.add(np.array([embedding]))
                # Store chunks in session state
                st.session_state['text_chunks_store'].append(chunk)
                # Tokenize and store chunk for BM25
                tokenized_chunks.append(chunk.split())
        
        # Update progress bar
        progress.progress((i + 1) / total_files)

    # Initialize BM25 after processing all files
    st.session_state['bm25'] = BM25Okapi(tokenized_chunks)
    
    st.success(f"Processed and stored vector embeddings for code files in directory: {directory}")

# Function to save FAISS index and embeddings to local storage
def save_embeddings(directory):
    faiss.write_index(index, os.path.join(directory, "code_embeddings.index"))
    
    # Save text chunks stored in session state
    with open(os.path.join(directory, "text_chunks_store.txt"), "w", encoding="utf-8") as f:
        for chunk in st.session_state['text_chunks_store']:
            f.write(f"{chunk}\n")
    
    st.success(f"Embeddings and text chunks saved in {directory}")

# Function to read text chunks from the saved file
def load_text_chunks(directory):
    text_chunks = []
    file_path = os.path.join(directory, "text_chunks_store.txt")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text_chunks = f.readlines()
        text_chunks = [chunk.strip() for chunk in text_chunks]  # Remove newline characters
        st.session_state['text_chunks_store'] = text_chunks  # Load into session state
    except FileNotFoundError:
        st.warning("Text chunk file not found.")
    
    return text_chunks

# Function to retrieve related chunks (previous and next)
def get_related_chunks(index):
    linked_context = ""
    if index > 0:
        linked_context += st.session_state['text_chunks_store'][index - 1] + "\n"  # Previous chunk
    if index < len(st.session_state['text_chunks_store']) - 1:
        linked_context += st.session_state['text_chunks_store'][index + 1] + "\n"  # Next chunk
    return linked_context

# Function to answer questions using hybrid search and linked chunks
def hybrid_search_and_answer(question, directory):
    # Load text chunks if not already loaded
    if not st.session_state['text_chunks_store']:
        st.session_state['text_chunks_store'] = load_text_chunks(directory)

    # BM25 keyword-based search
    tokenized_query = question.split()
    bm25_scores = st.session_state['bm25'].get_scores(tokenized_query)
    top_bm25_indices = np.argsort(bm25_scores)[::-1][:3]  # Top 3 BM25 results

    # FAISS embedding-based search
    question_embedding = get_embedding(question)
    k = 10  # Retrieve top 10 neighbors
    _, faiss_indices = index.search(np.array([question_embedding]), k)
    
    # Combine BM25 and FAISS results (hybrid approach)
    combined_indices = set(top_bm25_indices).union(set(faiss_indices[0]))
    
    # Retrieve context for the combined indices and link related chunks
    context = ""
    for idx in combined_indices:
        if idx < len(st.session_state['text_chunks_store']):
            context += st.session_state['text_chunks_store'][idx] + "\n"
            context += get_related_chunks(idx)  # Add related chunks for better context

    if context:
        st.write("Contextual code related to your question:")
        st.text(context)
        
        # Create prompt for Qwen model
        prompt_template = f"""
        You are an AI assistant expert at coding. Based on given context, write the code as per the user instructions.
        
        Context: {context}

        Instructions: {question}

        Instructions: Return only the code and nothing else. Do not include any explanations or comments.
        Answer:
        """
        
        # Tokenize and generate response using Qwen model
        inputs = tokenizer(prompt_template, return_tensors="pt")
        outputs = model.generate(**inputs, max_length=1024, temperature=1.0)
        generated_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        st.write("Generated response:")
        st.text(generated_response)
    else:
        st.warning("No relevant context found for your question.")

print("started")
# Streamlit app layout
st.title("Code Embedding and Q&A with Sentence-BERT, Qwen, and Hybrid Search")

# Directory browsing option
directory = st.text_input("Enter the directory path containing code files:")
if st.button("Process Directory") and directory:
    process_files_in_directory(directory)
    save_embeddings(directory)

# Text input for questions
user_question = st.text_area("Ask a question regarding the repository:")
if st.button("Get Answer") and user_question:
    hybrid_search_and_answer(user_question, directory)
