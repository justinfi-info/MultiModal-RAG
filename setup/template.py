import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="[%(asctime)s]: %(message)s")

list_of_files = [
    "src/__init__.py",
    "src/pd_processor.py",
    "src/gemini_client.py",
    "src/query_engine.py",
    "src/server.py",
    "src/ingest.py",
    "src/rag.py",
    "setup/setup.py",
    ".env",
    "requirements.txt",
    "app.py",
]

for file in list_of_files:
    filepath = Path(file)

    # Create directories if they don't exist
    if filepath.parent != Path(""):
        filepath.parent.mkdir(parents=True, exist_ok=True)
        logging.info(f"Creating directory: {filepath.parent}")

    # Create file if it doesn't exist or is empty
    if not filepath.exists() or filepath.stat().st_size == 0:
        filepath.touch()
        logging.info(f"Creating empty file: {filepath}")

    else:
        logging.info(f"{filepath.name} already exists")