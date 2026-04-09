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
        errors: list[str] = []

        # Primary parser: pypdf
        try:
            from pypdf import PdfReader  # type: ignore

            reader = PdfReader(bytes_to_stream(data))
            text = " ".join((page.extract_text() or "") for page in reader.pages)
            parsed = normalize_space(text)
            if parsed:
                return parsed
            errors.append("pypdf returned empty text")
        except Exception as exc:  # pragma: no cover - runtime parser variance
            errors.append(f"pypdf failed: {exc}")

        # Fallback parser: pdfplumber
        try:
            import pdfplumber  # type: ignore

            with pdfplumber.open(bytes_to_stream(data)) as pdf:
                text = " ".join((page.extract_text() or "") for page in pdf.pages)
            parsed = normalize_space(text)
            if parsed:
                return parsed
            errors.append("pdfplumber returned empty text")
        except Exception as exc:  # pragma: no cover - runtime parser variance
            errors.append(f"pdfplumber failed: {exc}")

        raise HTTPException(status_code=400, detail=f"Failed to parse PDF. {' | '.join(errors)}")

    def _parse_docx(self, data: bytes) -> str:
        try:
            import docx  # type: ignore
        except ImportError as exc:
            raise HTTPException(status_code=500, detail="python-docx dependency missing") from exc

        document = docx.Document(bytes_to_stream(data))
        text = " ".join(para.text for para in document.paragraphs if para.text)
        return normalize_space(text)


parser = ResumeParser()
