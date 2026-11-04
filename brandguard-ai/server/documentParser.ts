import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function extractTextFromFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<{ text: string; pageCount?: number }> {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'txt' || mimeType === 'text/plain') {
    return { text: fileBuffer.toString('utf-8') };
  }

  if (extension === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return { text: result.value.trim() };
  }

  if (extension === 'pdf' || mimeType === 'application/pdf') {
    try {
      const data = await pdfParse(fileBuffer);
      return { text: data.text.trim(), pageCount: data.numpages };
    } catch (err) {
      console.warn('PDF parsing error, attempting textual stream fallback:', err);
      // Fallback: extract visible ASCII streams from PDF buffer
      const raw = fileBuffer.toString('latin1');
      const textMatches = raw.match(/\(([^()]+)\)[\s]*Tj/g);
      if (textMatches && textMatches.length > 0) {
        const fallbackText = textMatches
          .map((m) => m.replace(/^\(/, '').replace(/\)[\s]*Tj$/, ''))
          .join(' ');
        return { text: fallbackText.trim() };
      }
      throw new Error('Unable to extract text from PDF document.');
    }
  }

  // Fallback for generic text
  return { text: fileBuffer.toString('utf-8') };
}
