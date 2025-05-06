from sentence_transformers import SentenceTransformer

# Load once when module is imported
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")