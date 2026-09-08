from dataclasses import dataclass
from pathlib import Path

import fitz


@dataclass
class PageImage:
    page_number: int
    image_bytes: bytes
    width: int
    height: int
    mime_type: str = "image/png"


class PDFProcessor:
    RENDER_ZOOM = 2.0
    MAX_PAGES = 50

    def __init__(self, zoom: float = RENDER_ZOOM):
        self.zoom = zoom
        self.matrix = fitz.Matrix(zoom, zoom)

    def load(self, pdf_path: str | Path) -> list[PageImage]:
        path = Path(pdf_path)
        if not path.exists():
            raise FileNotFoundError(f"PDF not found: {path}")
        if path.suffix.lower() != ".pdf":
            raise ValueError(f"Expected a .pdf file, got: {path.suffix}")

        doc = fitz.open(str(path))
        try:
            return self._render_all_pages(doc)
        finally:
            doc.close()

    def load_bytes(self, pdf_bytes: bytes) -> list[PageImage]:
        """Load a PDF from raw bytes."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            return self._render_all_pages(doc)
        finally:
            doc.close()

    def _render_all_pages(self, doc: fitz.Document) -> list[PageImage]:
        total = min(len(doc), self.MAX_PAGES)
        results = []

        for i in range(total):
            page = doc[i]
            pixmap = page.get_pixmap(matrix=self.matrix)
            results.append(PageImage(
                page_number=i + 1,
                image_bytes=pixmap.tobytes("png"),
                width=pixmap.width,
                height=pixmap.height,
            ))

        return results


