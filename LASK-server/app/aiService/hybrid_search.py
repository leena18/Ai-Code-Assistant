import os
from typing import List
import numpy as np
import faiss  # Ensure FAISS is imported
import pickle
from rank_bm25 import BM25Okapi
from app.embeddingService.embedding_processor import get_embedding
from app.models.models import Message
from app.models.chunk_model import load_text_chunks_store, get_related_chunks
from groq import Groq
import google.generativeai as genai

genai.configure(api_key="AIzaSyBWVp999sJ--3LAykvVbFHZwr3lVBzw13k")


os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
groq_api_key = "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"

# Load FAISS index from saved file
def load_faiss_index(directory):
    """Load FAISS index from the saved file."""
    index_path = os.path.join(directory, "code_embeddings.index")
    if os.path.exists(index_path):
        index = faiss.read_index(index_path)
        return index
    else:
        raise FileNotFoundError(f"FAISS index not found in {directory}")

def load_tokenized_chunks(directory):
    """Load tokenized chunks from the saved file."""
    tokenized_chunks_path = os.path.join(directory, "tokenized_chunks.pkl")
    if os.path.exists(tokenized_chunks_path):
        with open(tokenized_chunks_path, 'rb') as f:
            return pickle.load(f)
    else:
        raise FileNotFoundError(f"Tokenized chunks not found in {directory}")

# Hybrid search logic
def perform_hybrid_search(question: str, directory: str, top_k: int = 3) -> str:
    """Perform hybrid search using BM25 and FAISS, and return the combined context."""
    
    # Load FAISS index and tokenized chunks
    try:
        index = load_faiss_index(directory)
        tokenized_chunks = load_tokenized_chunks(directory)
    except FileNotFoundError as e:
        print(str(e))  # You may want to handle this more gracefully
        return ""

    # Initialize BM25 with tokenized code chunks
    bm25 = BM25Okapi(tokenized_chunks)
    
    # Tokenize the question
    tokenized_query = question.split()
    
    # Get BM25 scores
    bm25_scores = bm25.get_scores(tokenized_query)
    top_bm25_indices = np.argsort(bm25_scores)[::-1][:top_k]  # Top K BM25 results

    # FAISS embedding-based search
    question_embedding = get_embedding(question)

    # Ensure embedding is a 2D array
    if question_embedding.ndim == 1:
        question_embedding = np.expand_dims(question_embedding, axis=0)

    _, faiss_indices = index.search(question_embedding, top_k)

    # Combine BM25 and FAISS results
    combined_indices = set(top_bm25_indices).union(set(faiss_indices[0]))

    text_chunks_store = load_text_chunks_store(directory)

    # Retrieve context for the combined indices
    context = ""
    for idx in sorted(combined_indices):  # Sort indices for consistency
        context += get_related_chunks(idx, text_chunks_store)

    
    return context


# Reusable Groq API call
def generate_groq_response(prompt_template):
    """Generate a response from Groq API using the provided prompt template."""
    groq_client = Groq(api_key=groq_api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    messages = [{'role':'user', 'parts': prompt_template}]
    response = model.generate_content(
                                        messages
                                        )
    # completion = groq_client.chat.completions.create(
    #     model="mixtral-8x7b-32768",
    #     messages=[{"role": "user", "content": prompt_template}],
    #     temperature=0.01,
    #     max_tokens=2048,
    #     top_p=1,
    #     stream=True,
    #     stop=["the code is given above"]
    # )
    
    
    print("response generated")
    return response.text


# Specific response generation for code, general chat, and project discussions

def generate_code_response(question, directory,text_context_path):
    """Generate code response based on hybrid search context."""
    context = perform_hybrid_search(question, directory)
    print("context:" ,context)
    text_context = load_text_context(text_context_path)
    print(text_context)
    prompt_template = f"""
      Consider yourself a highly skilled programming expert with a deep understanding of various programming languages and paradigms.
      Your current task is to provide the most efficient and elegant code solution possible for the given user query.
      Leverage any provided context code if relevant, or seamlessly craft new code when necessary.

      ###User_Query: \n

      ```

      {question}

      ```

      ###Context_Code: \n

      ```
      {text_context}
      \n  

      ```

      Instructions:
      1. Carefully understand the programming task described in the ###User_Query.
      2. Thoroughly assess the Context Code. Determine if it contains functions, structures, or logic that directly align with the ###User_Query.
      3. If the ###Context_Code contains a function or class that already implements the desired functionality, your task is to use that function or class directly in your generated code.
         Do not create new implementations unless necessary.
      4. If the ###Context_Code has helpful parts that you can modify for the task, adapt and use those parts in your solution.
      5. If the ###Context_Code is irrelevant or insufficient, generate a new, complete code solution from scratch that fulfills the User Query
      6. Output the code in backticks ``` code ```
      7. Do not include any explanations, comments, or extra text.
    
    """
    return generate_groq_response(prompt_template)



    
    

def generate_code_response_alternatives(question, directory):
    """Generate code response based on hybrid search context."""
    context = perform_hybrid_search(question, directory)

    if context:
        prompt_template = f"""
        You are an AI assistant expert at coding. Based on given context, write the code in five different ways as per the user instructions.
        Context: {context}

        Instructions: {question}

        Instructions: Return only the code and nothing else. Do not include any explanations or comments.seperate the different code version from eachother by keeping a five new line blank space.
        Answer Format:
        code 1:
        
        code 2:
        
        code 3:
        
        code 4:
        
        code 5:
        """
        return generate_groq_response(prompt_template)
    else:
        return "No relevant context found."





def generate_project_discussion_response(question, directory):
    """Generate project discussion response based on hybrid search context."""
    context = perform_hybrid_search(question, directory)

    if context:
        prompt_template = f"""
        You are an AI assistant expert at discussing projects. Based on the given context, respond to the user's project-related discussion.

        Context: {context}

        Instructions: {question}
        Answer:
        """
        return generate_groq_response(prompt_template)
    else:
        return "No relevant context found."


def generate_comments_for_code(code: str) -> str:
    """Generate comments for the provided code using Groq API."""
    prompt_template = f"""
    You are an AI assistant expert in software development. Your task is to add comments to the given code. 
    Please add clear and concise comments to explain the code functionality.

    Code:
    {code}

    Comments:
    """

    return generate_groq_response(prompt_template)

# Method to fix code contextually based on existing coding style
def generate_code_fix_response(instruction, faulty_code, directory):
    """
    Generate a code fix response based on hybrid search context and adapt to the coding style
    of the code in context.
    """
    # Perform hybrid search to retrieve the context from the project
    context = perform_hybrid_search(faulty_code, directory)

    if context:
        prompt_template = f"""
        You are an expert coding assistant. Based on the given code context, fix the faulty code provided.
        
        Context: 
        {context}

        Faulty Code: 
        {faulty_code}

        {instruction}
        Instructions: Fix the faulty code provided above. Ensure the fixed code adheres to the style and conventions of the code in the context. Return only the fixed code without any explanations or comments. 
        Answer:
        """
        return generate_groq_response(prompt_template)
    else:
        return "No relevant context found to fix the code."

    
def generate_code_auto_fix_response(faulty_code, directory):
    """
    Generate a code fix response based on hybrid search context without user instructions.
    This method focuses on identifying and fixing common errors in the faulty code.
    """
    # Perform hybrid search to retrieve the context from the project
    context = perform_hybrid_search(faulty_code, directory)

    if context:
        prompt_template = f"""
        You are an expert coding assistant. Based on the code context and the faulty code provided, 
        automatically fix common errors and improve the code quality.
        
        Context: 
        {context}

        Faulty Code: 
        {faulty_code}

        Instructions: Fix any errors in the faulty code based on the context provided, and ensure the code adheres 
        to best coding practices. Return only the corrected code without explanations or comments.
        Answer:
        """
        return generate_groq_response(prompt_template)
    else:
        return "No relevant context found to fix the code."



def load_text_context(text_context_path: str) -> str:
    try:
        # Open the file in read mode and return its contents as a string
        with open(text_context_path, "r") as file:
            content = file.read()
        return content
    except FileNotFoundError:
        raise Exception(f"File not found at path: {text_context_path}")
    except Exception as e:
        raise Exception(f"Error reading the file: {str(e)}")