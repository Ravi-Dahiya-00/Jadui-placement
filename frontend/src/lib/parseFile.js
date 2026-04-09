/**
 * parseFile – Extract plain text from PDF, DOCX, or TXT files
 */
export async function parseFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const type = file.type;
  const name = file.name.toLowerCase();

  try {
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      return result.text.trim();
    }

    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }

    // Fallback: treat as plain text
    return buffer.toString('utf-8').trim();
  } catch (err) {
    console.error(`Failed to parse file ${file.name}:`, err);
    return '';
  }
}

/**
 * Extract candidate name from filename (best-effort)
 * e.g. "alice_chen_resume.pdf" → "Alice Chen"
 */
export function extractNameFromFilename(filename) {
  const nameRaw = filename
    .replace(/\.[^/.]+$/, '')       // remove extension
    .replace(/[-_]/g, ' ')           // replace separators with spaces
    .replace(/resume|cv|curriculum/gi, '') // remove common words
    .trim();

  return nameRaw
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
