import os
from dataclasses import dataclass
from pathlib import Path

import google.genai as genai
from dotenv import load_dotenv
from google.genai import types

try:
    from src.pd_processor import PageImage
except ImportError:
    from pd_processor import PageImage

load_dotenv(
    dotenv_path=Path(__file__).resolve().parents[1] / ".env",
    override=True,
)


def _normalize_api_key(value: str | None) -> str:
    if value is None:
        return ""
    value = value.strip()
    while value and value[0] in ('"', "'", "(") and value[-1] in ('"', "'", ")"):
        value = value[1:-1].strip()
    return value.strip().strip('"').strip("'")


@dataclass
class PageAnalysis:
    page_number: int
    raw_text: str
    has_charts: bool
    has_tables: bool
    key_numbers: list[str]


_ANALYST_SYSTEM_PROMPT = """
You are a document analyst specializing in reports.
When shown a page image, you must:
1. Extract all visible text, including text inside charts, axes, and tables.
2. Identify every numerical value and what it represents.
3. Describe chart types and what trends they show.
4. Read every table cell accurately.
5. Note any comparisons visible.

Be precise with numbers. Never skip a data point because it is small or in a legend.
Output everything you see; completeness is more important than brevity.
""".strip()


class GeminiVisionClient:
    Model = "gemini-2.5-flash-lite"

    def __init__(self):
        api_key = _normalize_api_key(
            os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        )
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY (or GOOGLE_API_KEY) not found or is malformed. Update your .env file to use GEMINI_API_KEY=your_key"
            )
        os.environ["GEMINI_API_KEY"] = api_key
        self.client = genai.Client(api_key=api_key)

    def analyze_page(self, page: PageImage) -> PageAnalysis:
        """Send a single page image to Gemini and parse the response."""
        image_part = types.Part.from_bytes(data=page.image_bytes, mime_type=page.mime_type)
        text_part = types.Part.from_text(
            text=(
                f"Analyze page {page.page_number} of this report. "
                "Extract all text, numbers, chart data, and table contents."
            )
        )

        response = self.client.models.generate_content(
            model=self.Model,
            contents=[image_part, text_part],
            config=types.GenerateContentConfig(
                system_instruction=_ANALYST_SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )

        extracted_text = getattr(response, "text", "") or ""
        return self._parse_analysis(page.page_number, extracted_text)

    def _parse_analysis(self, page_num: int, text: str) -> PageAnalysis:
        """Extract structured signals from the raw model output."""
        text_lower = text.lower()
        has_charts = any(word in text_lower for word in [
            "chart", "graph", "bar", "line", "pie", "trend", "axis", "legend"
        ])
        has_tables = any(word in text_lower for word in [
            "table", "row", "column", "header", "cell"
        ])

        key_numbers = [
            line.strip()
            for line in text.split("\n")
            if any(sym in line for sym in ["$", "%", "₹", "€", "£", "million", "billion", "hundred", "thousand", "lakhs", "crore"])
            and len(line.strip()) > 5
        ]

        return PageAnalysis(
            page_number=page_num,
            raw_text=text,
            has_charts=has_charts,
            has_tables=has_tables,
            key_numbers=key_numbers[:20],
        )

    def answer_question(self, question: str, pages: list[PageImage], page_context: list[PageAnalysis]) -> str:
        """Answer a question using selected page images and extracted text."""
        parts = []
        context_summary = "\n\n".join(
            f"[Page {analysis.page_number}]\n{analysis.raw_text}"
            for analysis in page_context
        )

        parts.append(types.Part.from_text(
            text=f"Here is what was extracted from the document:\n\n{context_summary}"
        ))

        for page in pages[:5]:
            parts.append(types.Part.from_bytes(data=page.image_bytes, mime_type=page.mime_type))

        parts.append(types.Part.from_text(
            text=f"\nBased on all the above, answer this question precisely:\n{question}"
        ))

        response = self.client.models.generate_content(
            model=self.Model,
            contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=_ANALYST_SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=1024,
            ),
        )
        return getattr(response, "text", "") or ""