# server/app/embeddingService/bm25_initializer.py
from rank_bm25 import BM25Okapi

# Global BM25 instance
bm25 = []

def initialize_bm25(tokenized_chunks):
    global bm25
    bm25 = BM25Okapi(tokenized_chunks)

def update_bm25_with_chunks(new_chunks):
    global bm25
    if bm25 is None:
        initialize_bm25(new_chunks)
    else:
        # Update BM25 with new chunks
        bm25.append(new_chunks)
       
