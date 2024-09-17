import streamlit as st
import os
from groq import Groq
from dotenv import load_dotenv
# for embeddings
from sentence_transformers import SentenceTransformer
import numpy as np

# Load environment variables
load_dotenv()

# Fetch API key from environment variables
api_key = os.getenv("GROQ_API_KEY")

# Initialize Sentence Transformer model for embeddings
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

if not api_key:
    st.error("API key not found. Please set the 'GROQ_API_KEY' environment variable.")
else:
    # Initialize Groq client with the API key
    client = Groq(api_key=api_key)

    # Function to generate code from user input with template
    def generate_code(instruction):
        # Define the prompt template with instruction to generate only code
        prompt_template = f"""
        You are an AI assistant. Generate only the code based on the following instruction. 
        Do not include any explanations, comments, or extra text. Return only the code and nothing else.

        Instruction: {instruction}

        Code:
        
        
        Your code is given above
        """

        completion = client.chat.completions.create(
            model="gemma-7b-it",
            messages=[
                {"role": "user", "content": prompt_template}
            ],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,  # Stream the response in real-time
            stop=["Your code is given above", "Explanation", "Comment"],  # Stop sequence to ensure only code is returned
        )

    
        generated_code = ""
        for chunk in completion:
            generated_code += chunk.choices[0].delta.content or ""
            # Stream the code as it's generated
        st.code(generated_code, language='python')    
        return generated_code

    # Function to generate embeddings for the code
    def generate_embeddings(code: str):
        """
        Generate embeddings for the given code using SentenceTransformer

        Args:
            code (str): The code to generate embeddings for.

        Returns:
            list: The generated embeddings or None if an error occurs.
        """
        try:
            st.write("Generating embeddings for the code...")
            embeddings = embedding_model.encode(code)
            
            # Debugging message: Show type and length of embeddings
            st.write(f"Embeddings type: {type(embeddings)}")
            st.write(f"Embedding shape: {np.shape(embeddings)}")

            return embeddings
        except Exception as e:
            st.error(f"Error generating embeddings: {e}")
            return None

    # Streamlit app layout
    st.title("Groq Coding Assistant")

    # User input for instructions
    user_input = st.text_area("Enter your code instruction:")

    # Generate button
    if st.button("Generate Code"):
        if user_input:
            st.write("Generating code based on your instruction...")
            generated_code = generate_code(user_input)
            st.success("Code generation complete!")

            # Generate embeddings for the generated code
            embeddings = generate_embeddings(generated_code)
                
            # Verify embeddings
            if embeddings is not None and len(embeddings) > 0:
                st.write("Embeddings generated successfully.")
                
                # Show a sample of the embedding for verification
                st.write("First 10 embedding values:", embeddings[:10])
            else:
                st.error("Failed to generate embeddings. Check the code and input.")
