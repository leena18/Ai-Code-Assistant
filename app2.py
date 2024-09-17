import os
import networkx as nx
from node2vec import Node2Vec
import streamlit as st
import numpy as np
import faiss
import requests

# Load your Gemini API key from an environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Simulate Gemini API call for generating code without specifying endpoint
def generate_code(prompt):
    try:
        headers = {
            'Authorization': f'Bearer {GEMINI_API_KEY}',
            'Content-Type': 'application/json',
        }

        # Assume the Gemini API accepts prompts for code generation
        data = {
            'prompt': prompt,
            'max_tokens': 100,  # Adjust token limit based on expected code length
            'temperature': 0.7  # Adjust creativity level
        }

        # Placeholder for the actual Gemini API call
        # Replace this with the actual Gemini API interaction

        # we will replace this with actual address when hosted so as to get the http request succesful 
        # uptil then we have used some hard coded prompt for generation
        response = requests.post("https://gemini.api.codegeneration", headers=headers, json=data)  # Modify this according to Gemini API documentation
        if response.status_code == 200:
            generated_code = response.json().get('code', '').strip()
            return generated_code
        else:
            return f"Error generating code: {response.status_code} {response.text}"
    except Exception as e:
        return f"Error generating code: {e}"
    

    #    try:
    #     # Simulate the API response instead of making a real HTTP request
    #     # You can customize this to return more complex code based on the prompt
    #     if "add" in prompt:
    #         return "def add_two_numbers(a, b):\n    return a + b"
    #     elif "subtract" in prompt:
    #         return "def subtract_two_numbers(a, b):\n    return a - b"
    #     else:
    #         return "def default_function():\n    pass"
    # except Exception as e:
    #     return f"Error generating code: {e}"

# Function to convert code into a graph structure
def code_to_graph(code):
    G = nx.DiGraph()  # Directed graph for function dependencies

    # Basic mock parser - in real applications, use an actual code parser
    lines = code.split("\n")
    for i, line in enumerate(lines):
        if "def " in line:
            function_name = line.split("def ")[1].split("(")[0]
            G.add_node(function_name, label='function')
            if i > 0:
                previous_function = lines[i - 1].split("def ")[1].split("(")[0]
                G.add_edge(previous_function, function_name)
    
    return G

# Function to generate embeddings from a graph using Node2Vec
def graph_to_embeddings(G):
    # Initialize Node2Vec
    node2vec = Node2Vec(G, dimensions=64, walk_length=30, num_walks=200, workers=4)
    
    # Simulate walks to build vocabulary
    walks = node2vec.walks

    # Build the vocabulary for the model
    model = node2vec.fit(window=10, min_count=1)
    
    # Ensure vocabulary is built
    model.build_vocab(walks)

    # Train the model
    model.train(walks, total_examples=model.corpus_count, epochs=model.epochs)
    
    # Extract embeddings
    embeddings = {node: model.wv[node] for node in G.nodes()}
    return embeddings

# Function to store embeddings in FAISS
def store_embeddings(embeddings):
    # Create a FAISS index
    dimension = 64  # Match the dimension used for Node2Vec
    index = faiss.IndexFlatL2(dimension)
    
    # Prepare the data for FAISS
    vectors = np.array([emb.tolist() for node, emb in embeddings.items()], dtype=np.float32)
    index.add(vectors)
    
    # Return the FAISS index for future queries
    return index

# Streamlit App
st.title("AI Code Generator and Graph Embeddings")

# Input prompt
prompt = st.text_input("Enter a prompt to generate code:")

if prompt:
    # 1. Generate code from natural language using the Gemini API key
    generated_code = generate_code(prompt)
    st.subheader("Generated Code:")
    st.code(generated_code, language='python')

    # 2. Convert the code into a graph representation
    code_graph = code_to_graph(generated_code)
    
    st.subheader("Graph Representation:")
    st.write("Nodes in the graph:", list(code_graph.nodes))
    st.write("Edges in the graph:", list(code_graph.edges()))

    # 3. Generate embeddings from the graph
    embeddings = graph_to_embeddings(code_graph)

    # Display embeddings
    st.subheader("Graph Embeddings:")
    for node, embedding in embeddings.items():
        st.write(f"Node: {node}, Embedding: {embedding[:5]}...")  # Showing first 5 values for brevity

    # 4. Store the embeddings in FAISS for fast retrieval
    faiss_index = store_embeddings(embeddings)
    st.success("Embeddings have been stored successfully in FAISS!")
