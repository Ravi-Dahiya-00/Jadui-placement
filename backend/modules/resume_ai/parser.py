"""Resume parser module (PDF/DOCX/TXT) adapted from HireLens parseFile logic."""

from __future__ import annotations

from fastapi import HTTPException

from .utils import bytes_to_stream, normalize_space


class ResumeParser:
    def parse_bytes(self, filename: str, mime_type: str, data: bytes) -> str:
        filename_l = (filename or "").lower()
        mime_type = mime_type or ""

        try:
            if mime_type == "application/pdf" or filename_l.endswith(".pdf"):
                return self._parse_pdf(data)

            if (
                mime_type
                == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                or filename_l.endswith(".docx")
            ):
                return self._parse_docx(data)

            return normalize_space(data.decode("utf-8", errors="ignore"))
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Failed to parse file: {filename}") from exc

    def _parse_pdf(self, data: bytes) -> str:
        try:
            from pypdf import PdfReader  # type: ignore
        except ImportError as exc:
            raise HTTPException(status_code=500, detail="pypdf dependency missing") from exc

        reader = PdfReader(bytes_to_stream(data))
        text = " ".join((page.extract_text() or "") for page in reader.pages)
        return normalize_space(text)

    def _parse_docx(self, data: bytes) -> str:
        try:
            import docx  # type: ignore
        except ImportError as exc:
            raise HTTPException(status_code=500, detail="python-docx dependency missing") from exc

        document = docx.Document(bytes_to_stream(data))
        text = " ".join(para.text for para in document.paragraphs if para.text)
        return normalize_space(text)


parser = ResumeParser()
