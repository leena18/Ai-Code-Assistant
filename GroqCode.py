import streamlit as st
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Fetch API key from environment variables
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    st.error("API key not found. Please set the 'GROQ_API_KEY' environment variable.")
else:
    # Initialize Groq client with the API key
    client = Groq(api_key=api_key)

    # Function to generate code from user input with template
    def generate_code(instruction, complete=False):
        # Define the prompt template for generating code
        if not complete:
            prompt_template = f"""
            You are an AI assistant. Generate only the code based on the following instruction. 
            Do not include any explanations, comments, or extra text. Return only the code and nothing else.

            Instruction: {instruction}

            Code:


            Your code is given above
            """
        else:
            # Define the prompt template for completing code
            prompt_template = f"""
            You are an AI assistant. Generate only the code based on the following instruction. 
            Do not include any explanations, comments, or extra text. Return only the code and nothing else.

            Instruction: {instruction}
            Complete the above code
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

    # Streamlit app layout
    st.title("Groq Coding Assistant")

    # User input for instructions
    user_input = st.text_area("Enter your code instruction:")

    # Generate Code button (row 1)
    if st.button("Generate Code"):
        if user_input:
            st.write("Generating code based on your instruction...")
            generated_code = generate_code(user_input)
            st.success("Code generation complete!")

    # Complete Code button (row 2)
    if st.button("Complete Code"):
        if user_input:
            st.write("Completing code based on your instruction...")
            generated_code = generate_code(user_input, complete=True)
            st.success("Code completion complete!")
