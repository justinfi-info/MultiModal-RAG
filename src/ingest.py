from __future__ import annotations

from pathlib import Path
from typing import Iterable

import chromadb
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

chromadb_client = chromadb.PersistentClient(path="./chroma_db")
collection = chromadb_client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"},
)


def load_and_split_documents(docs_folder: str | Path) -> list:
    """Load all .txt files from a folder and split them into chunks."""
    docs_path = Path(docs_folder)
    if not docs_path.exists():
        raise FileNotFoundError(f"Documents folder not found: {docs_path}")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=50,
        length_function=len,
    )

    all_chunks = []
    for txt_file in docs_path.glob("*.txt"):
        loader = TextLoader(str(txt_file), encoding="utf-8")
        documents = loader.load()
        chunks = text_splitter.split_documents(documents)
        all_chunks.extend(chunks)
        print(f"Loaded {len(chunks)} chunks from {txt_file.name}")

    return all_chunks


def ingest_to_chromadb(chunks: Iterable[object]) -> None:
    """Store document chunks in ChromaDB."""
    chunk_list = list(chunks)
    if not chunk_list:
        raise ValueError("No chunks were provided to ingest_to_chromadb.")

    documents = [chunk.page_content for chunk in chunk_list]
    ids = [f"chunk_{i}" for i in range(len(chunk_list))]
    metadatas = [
        {"source": getattr(chunk, "metadata", {}).get("source", "unknown")}
        for chunk in chunk_list
    ]

    collection.add(
        documents=documents,
        ids=ids,
        metadatas=metadatas,
    )
    print(f"Stored {len(documents)} chunks in ChromaDB.")


if __name__ == "__main__":
    print("Starting document ingestion....")
    chunks = load_and_split_documents("docs")

    if not chunks:
        print("No .txt files found in docs/ folder.")
    else:
        ingest_to_chromadb(chunks)
        print(f"\nDone! Total chunks stored: {len(chunks)}")
        print("Your knowledge base is ready.")
