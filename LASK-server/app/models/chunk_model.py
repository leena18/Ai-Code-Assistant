import pickle
import os
import numpy as np

# Load the stored chunks
def load_text_chunks_store(directory):
    """Load the text chunks store from the pickle file."""
    with open(os.path.join(directory, "text_chunks_store.pkl"), 'rb') as f:
        text_chunks_store = pickle.load(f)
    return text_chunks_store

def split_text(text, chunk_size=1000, chunk_overlap=100):
    """Split text into overlapping chunks."""
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]


def get_related_chunks(index, text_chunks_store):
    """Retrieve related chunks (previous and next) around the specified index, with error handling."""
    try:
        # Check if index is a valid integer type, including numpy.int64
        if not isinstance(index, (int, np.integer)):
            raise ValueError(f"Invalid index type: {type(index)}. Index should be an integer or numpy integer.")
        
        if not isinstance(text_chunks_store, list):
            raise TypeError(f"Invalid text_chunks_store type: {type(text_chunks_store)}. Expected a list.")
        
        if index < 0 or index >= len(text_chunks_store):
            raise IndexError(f"Index {index} is out of bounds for text_chunks_store of length {len(text_chunks_store)}.")
        
        print("Getting related chunks")
        linked_context = ""
        
        # Helper function to ensure chunks are strings
        def safe_add_chunk(chunk):
            if isinstance(chunk, str):
                return chunk
            else:
                # Convert non-string chunks to a string representation
                return str(chunk)

        # Add the previous chunk if available
        if index > 0:
            linked_context += safe_add_chunk(text_chunks_store[index - 1]) + "\n"
        print("Added previous chunk")
        
        # Add the next chunk if available
        if index < len(text_chunks_store) - 1:
            linked_context += safe_add_chunk(text_chunks_store[index + 1]) + "\n"
        print("Added next chunk")
        
        return linked_context

    except IndexError as ie:
        print(f"Error: {ie}")
    except TypeError as te:
        print(f"Error: {te}")
    except ValueError as ve:
        print(f"Error: {ve}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    
    # Return an empty string or None if an error occurs
    return ""
