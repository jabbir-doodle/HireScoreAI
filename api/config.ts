import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    provider: 'openrouter',
    models: [
      { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', recommended: true },
      { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', recommended: true },
      { id: 'openai/gpt-5.2', name: 'GPT-5.2', recommended: true },
      { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', recommended: true },
    ],
    features: {
      screening: true,
      batchProcessing: true,
      maxCVsPerBatch: 50,
    }
  });
}
