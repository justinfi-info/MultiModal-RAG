from __future__ import annotations

import io
import sys
import time
from pathlib import Path

import requests

BASE_URL = "http://127.0.0.1:8000"


def wait_for_server(timeout: float = 15.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            response = requests.get(f"{BASE_URL}/", timeout=2)
            if response.status_code == 200:
                return
        except requests.RequestException:
            time.sleep(0.5)
    raise RuntimeError(f"Server did not become ready at {BASE_URL}/ within {timeout}s")


def main() -> None:
    wait_for_server()

    sample_pdf = Path("sample_report")
    if not sample_pdf.exists():
        raise FileNotFoundError(
            "sample_report directory not found. Place a sample PDF in sample_report before running this script."
        )

    pdf_files = sorted(sample_pdf.rglob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(
            "No PDF files found in sample_report. Add a sample PDF to run the smoke test."
        )

    pdf_path = pdf_files[0]
    with pdf_path.open("rb") as f:
        files = {"file": (pdf_path.name, f, "application/pdf")}
        ingest_response = requests.post(
            f"{BASE_URL}/ingest",
            files=files,
            timeout=120,
        )

    print(f"INGEST STATUS: {ingest_response.status_code}")
    print(f"INGEST BODY: {ingest_response.text}")
    ingest_response.raise_for_status()
    ingest_data = ingest_response.json()

    session_id = ingest_data.get("session_id")
    if not session_id:
        raise RuntimeError(f"Expected 'session_id' in ingest response: {ingest_data}")

    query_payload = {
        "question": "Summarize the main findings in this document.",
        "session_id": session_id,
    }
    query_response = requests.post(
        f"{BASE_URL}/query",
        json=query_payload,
        timeout=120,
    )

    print(f"QUERY STATUS: {query_response.status_code}")
    print(f"QUERY BODY: {query_response.text}")
    query_response.raise_for_status()
    query_data = query_response.json()

    if not query_data.get("answer"):
        raise RuntimeError(f"Expected a non-empty answer in query response: {query_data}")

    print("Smoke test completed successfully.")


if __name__ == "__main__":
    main()
