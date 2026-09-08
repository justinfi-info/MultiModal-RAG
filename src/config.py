import os

from dotenv import load_dotenv

load_dotenv()

# LLM configuration block
LLM_CONFIG = {
    "provider": "gemini",
    "config": {
        "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
        "temperature": 0.1,
        "max_tokens": 2000,
    },
}

# Embedder configuration block
EMBEDDER_CONFIG = {
    "provider": "huggingface",
    "config": {
        "model": os.getenv(
            "EMBEDDING_MODEL",
            "sentence-transformers/all-MiniLM-L6-v2",
        ),
        "embedding_dims": 384,
    },
}

# Vector store configuration block
VECTOR_STORE_CONFIG = {
    "provider": "qdrant",
    "config": {
        "collection_name": os.getenv("QDRANT_COLLECTION", "memory_agent"),
        "path": os.getenv("QDRANT_PATH", os.path.join(os.getcwd(), ".qdrant")),
        "embedding_model_dims": 384,
    },
}


def get_config() -> dict:
    """Build and return the complete mem0 configuration dictionary."""
    return {
        "llm": LLM_CONFIG,
        "embedder": EMBEDDER_CONFIG,
        "vector_store": VECTOR_STORE_CONFIG,
    }
