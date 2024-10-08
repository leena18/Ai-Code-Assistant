import streamlit as st
import os
import torch
from transformers import AutoTokenizer, AutoModel
import faiss
import numpy as np
from groq import Groq  # Import the Groq client

# Load the BERT model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base", clean_up_tokenization_spaces=True)
model = AutoModel.from_pretrained("microsoft/codebert-base")

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

groq_api_key = os.getenv("GROQ_API_KEY")

# Initialize FAISS index for vector storage
d = 768  # Dimension of BERT embeddings
index = faiss.IndexFlatL2(d)  # L2 distance index for cosine similarity

# Initialize text_chunks_store in session state
if 'text_chunks_store' not in st.session_state:
    st.session_state['text_chunks_store'] = []

# Function to generate BERT embeddings
def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()  # Get mean of token embeddings

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
        
        # Update progress bar
        progress.progress((i + 1) / total_files)
    
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

# Function to answer questions using Groq API and loaded text chunks
def answer_question(question, directory):
    # Load text chunks if not already loaded
    if not st.session_state['text_chunks_store']:
        st.session_state['text_chunks_store'] = load_text_chunks(directory)
    
    # Generate the question embedding
    question_embedding = get_embedding(question)
    
    # Search FAISS index for relevant context
    k = 3  # Number of neighbors to retrieve
    distances, indices = index.search(np.array([question_embedding]), k)

    context = ""
    for idx in indices[0]:
        if idx < len(st.session_state['text_chunks_store']):
            context += st.session_state['text_chunks_store'][idx] + "\n"

    if context:
        st.write("Contextual code related to your question:")
        st.text(context)
        
        # Create prompt for Groq or other completion API
        prompt_template = f"""
        You are an AI assistant. Answer the following question based on the provided context.

        Question: {question}
        Context: {context}

        Answer:
        """
        groq_client = Groq(api_key=groq_api_key)
        # Call to Groq API for chat completion (or similar API)
        completion = groq_client.chat.completions.create(
            model="gemma-7b-it",
            messages=[{"role": "user", "content": prompt_template}],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,
        )
        
        # Streaming response handling
        st.write("Generated response:")
        generated_response = ""
        
        for chunk in completion:
            if hasattr(chunk.choices[0].delta, 'content'):
                generated_response += chunk.choices[0].delta.content or ""
                st.text(chunk.choices[0].delta.content)  # Display chunk content

        st.text(generated_response)
    else:
        st.warning("No relevant context found for your question.")

# Streamlit app layout
st.title("Code Embedding and Q&A with BERT and Groq")

# Directory browsing option
directory = st.text_input("Enter the directory path containing code files:")
if st.button("Process Directory") and directory:
    process_files_in_directory(directory)
    save_embeddings(directory)

# Text input for questions
user_question = st.text_area("Ask a question regarding the repository:")
if st.button("Get Answer") and user_question:
    answer_question(user_question, directory)
