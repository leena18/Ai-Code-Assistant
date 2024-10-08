import pickle
import os

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
    """Retrieve related chunks (previous and next) around the specified index."""
    linked_context = ""
    # Add the previous chunk if available
    if index > 0:
        linked_context += text_chunks_store[index - 1] + "\n"
    # Add the next chunk if available
    if index < len(text_chunks_store) - 1:
        linked_context += text_chunks_store[index + 1] + "\n"
    return linked_context
