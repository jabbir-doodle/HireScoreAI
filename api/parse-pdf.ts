import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Minimum characters for valid text extraction (scanned PDFs have almost no text)
const MIN_TEXT_LENGTH = 100;

// Best OCR model on OpenRouter - Qwen3-VL (cheap: $0.12/M input, $0.56/M output)
const OCR_MODEL = 'qwen/qwen3-vl-235b-a22b-instruct';

/**
 * Smart PDF Parser with OCR Fallback
 *
 * Strategy:
 * 1. First try pdf-parse (fast, free, works for text-based PDFs)
 * 2. If text is too short (scanned PDF), use Qwen3-VL OCR
 *
 * This saves 90%+ tokens for text-based PDFs while still handling scanned docs
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64, useOcr } = req.body;

    if (!base64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');

    // STAGE 1: Try fast text extraction with pdf-parse
    let extractedText = '';
    let pageCount = 0;

    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      extractedText = data.text?.trim() || '';
      pageCount = data.numpages || 1;

      console.log(`PDF parsed: ${pageCount} pages, ${extractedText.length} chars`);
    } catch (parseError) {
      console.error('pdf-parse failed:', parseError);
    }

    // If we got enough text, return it (fast path - no API cost!)
    if (extractedText.length >= MIN_TEXT_LENGTH && !useOcr) {
      return res.json({
        success: true,
        text: extractedText,
        pages: pageCount,
        method: 'text-extraction',
        tokensSaved: true,
      });
    }

    // STAGE 2: Use Qwen3-VL OCR for scanned/image PDFs
    console.log('Text extraction insufficient, using Qwen3-VL OCR...');

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      // Fallback: return whatever text we got
      return res.json({
        success: true,
        text: extractedText || '[Scanned PDF - OCR not available. Please paste CV text manually.]',
        pages: pageCount,
        method: 'fallback',
        warning: 'API key not configured for OCR',
      });
    }

    // Convert PDF to base64 image data URL for vision model
    const imageDataUrl = `data:application/pdf;base64,${base64}`;

    // Call Qwen3-VL for OCR
    const ocrResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://rankhr.vercel.app',
        'X-Title': 'HireScore AI - PDF OCR',
      },
      body: JSON.stringify({
        model: OCR_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract ALL text from this CV/resume document. Preserve the structure including:
- Name and contact information
- Work experience with dates, company names, job titles, and descriptions
- Education history
- Skills and certifications
- Any other relevant information

Output the extracted text in a clean, readable format. Do NOT add any commentary - just extract the text exactly as it appears.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error('OCR API error:', ocrResponse.status, errorText);

      // Return whatever text we have from pdf-parse
      return res.json({
        success: true,
        text: extractedText || '[PDF OCR failed. Please paste CV text manually.]',
        pages: pageCount,
        method: 'fallback',
        warning: 'OCR failed - using text extraction fallback',
      });
    }

    const ocrData = await ocrResponse.json();
    const ocrText = ocrData.choices?.[0]?.message?.content || '';

    if (ocrText.length > extractedText.length) {
      return res.json({
        success: true,
        text: ocrText,
        pages: pageCount,
        method: 'ocr',
        model: OCR_MODEL,
        usage: ocrData.usage,
      });
    }

    // Return the better result
    return res.json({
      success: true,
      text: extractedText || ocrText || '[Unable to extract text from PDF]',
      pages: pageCount,
      method: extractedText.length > ocrText.length ? 'text-extraction' : 'ocr',
    });

  } catch (error) {
    console.error('PDF parse error:', error);
    res.status(500).json({
      error: 'Failed to parse PDF',
      message: (error as Error).message,
    });
  }
}
