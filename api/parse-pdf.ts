import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');

    // Dynamic import pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    res.json({
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info,
    });
  } catch (error) {
    console.error('PDF parse error:', error);
    res.status(500).json({
      error: 'Failed to parse PDF',
      message: (error as Error).message,
    });
  }
}
