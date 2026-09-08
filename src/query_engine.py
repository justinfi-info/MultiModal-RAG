from dataclasses import dataclass, field

try:
    from src.pd_processor import PDFProcessor, PageImage
    from src.gemini_client import GeminiVisionClient, PageAnalysis
except ImportError:
    from pd_processor import PDFProcessor, PageImage
    from gemini_client import GeminiVisionClient, PageAnalysis


@dataclass
class DocumentSession:
    """Holds a processed document in memory for repeated querying."""

    pdf_path: str
    pages: list[PageImage] = field(default_factory=list)
    analyses: list[PageAnalysis] = field(default_factory=list)
    total_pages: int = 0

    @property
    def is_ready(self) -> bool:
        return len(self.analyses) > 0


DocumentSesssion = DocumentSession


class QueryEngine:
    def __init__(self):
        self.processor = PDFProcessor()
        self._vision: GeminiVisionClient | None = None
        self.sessions: dict[str, DocumentSession] = {}

    def _get_vision(self) -> GeminiVisionClient:
        if self._vision is None:
            self._vision = GeminiVisionClient()
        return self._vision

    def ingest(self, session_id: str, pdf_bytes: bytes) -> dict:
        """Process a PDF and store all page analyses. Call once per document."""
        pages = self.processor.load_bytes(pdf_bytes)
        analyses = []
        print(f"[QueryEngine] Ingesting {len(pages)} pages...")
        vision = self._get_vision()

        for page in pages:
            print(f"  -> Analyzing page {page.page_number}/{len(pages)}")
            analyses.append(vision.analyze_page(page))

        session = DocumentSession(
            pdf_path=session_id,
            pages=pages,
            analyses=analyses,
            total_pages=len(pages),
        )
        self.sessions[session_id] = session

        return {
            "session_id": session_id,
            "total_pages": len(pages),
            "pages_with_charts": [a.page_number for a in analyses if a.has_charts],
            "pages_with_tables": [a.page_number for a in analyses if a.has_tables],
            "status": "ready",
        }

    def query(self, session_id: str, question: str, page_numbers: list[int] | None = None) -> dict:
        """Answer a question about a previously ingested document."""
        session = self.sessions.get(session_id)
        if not session:
            raise KeyError(f"No session found: {session_id}. Call ingest() first.")
        if not session.is_ready:
            raise RuntimeError("Document is still being processed.")

        selected_analyses = session.analyses
        selected_pages = session.pages
        if page_numbers:
            selected_analyses = [a for a in session.analyses if a.page_number in page_numbers]
            selected_pages = [p for p in session.pages if p.page_number in page_numbers]

        answer = self._get_vision().answer_question(
            question,
            selected_pages,
            selected_analyses,
        )

        return {
            "session_id": session_id,
            "answer": answer,
            "page_numbers": [p.page_number for p in selected_pages],
            "status": "ok",
        }


QueryEngines = QueryEngine