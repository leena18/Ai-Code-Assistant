import streamlit as st
import os
import faiss
import numpy as np
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS

# Load environment variables
load_dotenv()

# Fetch API key from environment variables
google_api_key = os.getenv("GOOGLE_GENAI_API_KEY")

if not google_api_key:
    st.error("Google GenAI API key not found. Please set the 'GOOGLE_GENAI_API_KEY' environment variable.")
else:
    # Initialize GoogleGenerativeAIEmbeddings with API key
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)
    
    # Initialize FAISS index for vector storage
    d = 768  # Dimension of embeddings (adjust based on your model)
    index = faiss.IndexFlatL2(d)  # L2 distance index for cosine similarity
    
    # Function to generate embeddings using Google Generative AI
    def get_embedding(text):        
        embedding = embeddings.embed_documents([text])[0]  # Use embed_documents to generate embeddings
        return np.array(embedding)
    
    # Function to split text into manageable chunks
    def split_text(text, chunk_size=1000, chunk_overlap=100):
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        return text_splitter.split_text(text)
    
    # Function to upload file, read content, and store vector embeddings
    def upload_and_store_file(file):
        file_content = file.read().decode('utf-8')  # Read and decode the uploaded file
        text_chunks = split_text(file_content)  # Split the file content into chunks
        for chunk in text_chunks:
            file_embedding = get_embedding(chunk)  # Get embedding for the text chunk
            index.add(np.array([file_embedding]))  # Add to FAISS index
        st.success(f"Uploaded and stored vector embeddings for {file.name}")
    
    # Function to generate code with context from embeddings
    def generate_code_with_context(instruction, complete=False):
        # Generate embedding for the instruction
        instruction_embedding = get_embedding(instruction)
        
        # Search the FAISS index for the closest vectors to add as context
        k = 1  # Number of neighbors (adjust based on how much context you need)
        _, context_indices = index.search(np.array([instruction_embedding]), k)
        
        # Placeholder: Retrieve the context from the indices (for demonstration purposes)
        context = "Relevant context from file embeddings: [Placeholder for actual context]"
        
        # Define the prompt template for generating code
        if not complete:
            prompt_template = f"""
            You are an AI assistant. Generate only the code based on the following instruction. 
            Do not include any explanations, comments, or extra text. Return only the code and nothing else.

            Instruction: {instruction}

            Context: {context}

            Code:
            """
        else:
            prompt_template = f"""
            You are an AI assistant. Generate only the code based on the following instruction. 
            Do not include any explanations, comments, or extra text. Return only the code and nothing else.

            Instruction: {instruction}
            Complete the above code
            Context: {context}

            Code:
            """
        
        # Use your preferred LLM API to generate the code completion here
        completion = "Generated code based on context..."  # Placeholder for actual LLM completion
        st.code(completion, language='python')
        return completion
    
    # Streamlit app layout
    st.title("AI Coding Assistant with Contextual Embeddings")

    # File upload for storing embeddings
    uploaded_file = st.file_uploader("Upload a .java, .js, .py, or .php file", type=['java', 'js', 'py', 'php'])
    
    if uploaded_file:
        upload_and_store_file(uploaded_file)

    # User input for instructions
    user_input = st.text_area("Enter your code instruction:")

    # Generate Code button
    if st.button("Generate Code"):
        if user_input:
            st.write("Generating code based on your instruction and context...")
            generate_code_with_context(user_input)

    # Complete Code button
    if st.button("Complete Code"):
        if user_input:
            st.write("Completing code based on your instruction and context...")
            generate_code_with_context(user_input, complete=True)
