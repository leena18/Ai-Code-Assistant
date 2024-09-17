# tree-sitter-python: A Tree-sitter parser for Python. 
# If you plan to support more languages, you'll need to install their respective Tree-sitter parser

# Run this script once to build the language library. 
# You can integrate this into your setup or run it manually.
# If you're only using Python, the above setup suffices. 
# For other languages, clone their Tree-sitter repositories and include them in the build_library list.


import streamlit as st
import os
from groq import Groq
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from tree_sitter import Language, Parser
import json
import numpy as np

# Load environment variables
load_dotenv()

# Fetch API key from environment variables
api_key = os.getenv("GROQ_API_KEY")

# Initialize Sentence Transformer model for embeddings
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Build and load the Tree-sitter language library
LANGUAGE_LIBRARY_PATH = 'build/my-languages.so'
PY_LANGUAGE = 'python'

# Ensure the language library exists
if not os.path.exists(LANGUAGE_LIBRARY_PATH):
    st.error(f"Language library not found at {LANGUAGE_LIBRARY_PATH}. Please build it using the Tree-sitter setup instructions.")
else:
    # Load the languages
    LANGUAGE = Language(LANGUAGE_LIBRARY_PATH, PY_LANGUAGE)

    # Initialize parser
    parser = Parser()
    parser.set_language(LANGUAGE)

    if not api_key:
        st.error("API key not found. Please set the 'GROQ_API_KEY' environment variable.")
    else:
        # Initialize Groq client with the API key
        client = Groq(api_key=api_key)

        # Function to generate code from user input with template
        def generate_code(instruction: str) -> str:
            """
            Generate code based on the given instruction using Groq API.

            Args:
                instruction (str): The instruction for generating code.

            Returns:
                str: The generated code.
            """
            prompt_template = f"""
            You are an AI assistant. Generate only the code based on the following instruction. 
            Do not include any explanations, comments, or extra text. Return only the code and nothing else.

            Instruction: {instruction}

            Code:
            """
            
            completion = client.chat.completions.create(
                model="gemma-7b-it",
                messages=[{"role": "user", "content": prompt_template}],
                temperature=0.2,  # Lowered temperature for focused output
                max_tokens=1024,
                top_p=1,
                stream=True,  # Stream the response in real-time
                stop=["Your code is given above", "Explanation", "Comment"],  # Stop sequences
            )

            generated_code = ""
            for chunk in completion:
                chunk_content = chunk.choices[0].delta.content or ""
                generated_code += chunk_content
                # Debugging message: Show code chunks as they're being received
                st.write("Received code chunk:", chunk_content)

            # Display final generated code
            st.code(generated_code, language='python')    
            return generated_code

        # Function to convert AST to a JSON-like dictionary
        def ast_to_dict(node):
            """
            Recursively convert AST nodes to a dictionary.

            Args:
                node: A tree_sitter Node.

            Returns:
                dict: A dictionary representation of the AST node.
            """
            node_dict = {
                'type': node.type,
                'children': []
            }
            for child in node.children:
                node_dict['children'].append(ast_to_dict(child))
            return node_dict

        # Function to generate tree-based embeddings for the code
        def generate_tree_embeddings(code: str) -> np.ndarray:
            """
            Generate embeddings for the AST of the given code using SentenceTransformer.

            Args:
                code (str): The code to parse and generate embeddings for.

            Returns:
                np.ndarray: The generated tree-based embeddings or None if an error occurs.
            """
            try:
                # Parse the code into an AST
                tree = parser.parse(bytes(code, "utf8"))
                root_node = tree.root_node

                # Convert AST to a dictionary
                ast_dict = ast_to_dict(root_node)

                # Serialize the AST dictionary to a JSON string
                ast_json = json.dumps(ast_dict)

                # Generate embeddings from the AST JSON string
                embeddings = embedding_model.encode(ast_json)

                # Debugging messages
                st.write("Embeddings type:", type(embeddings))
                st.write("Embedding shape:", embeddings.shape)
                st.write("First 10 embedding values:", embeddings[:10])

                return embeddings
            except Exception as e:
                st.error(f"Error generating tree embeddings: {e}")
                return None

        # Streamlit app layout
        st.title("Groq Coding Assistant with Tree Embeddings")

        # User input for instructions
        user_input = st.text_area("Enter your code instruction:")

        # Generate button
        if st.button("Generate Code"):
            if user_input:
                st.write("Generating code based on your instruction...")
                generated_code = generate_code(user_input)
                st.success("Code generation complete!")

                # Generate tree-based embeddings for the generated code
                tree_embeddings = generate_tree_embeddings(generated_code)

                # Verify embeddings
                if tree_embeddings is not None and tree_embeddings.size > 0:
                    st.write("Tree embeddings generated successfully.")
                else:
                    st.error("Failed to generate tree embeddings. Check the code and input.")
