import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    provider: 'openrouter',
    models: [
      { id: 'z-ai/glm-4.7', name: 'GLM 4.7 (Budget)', recommended: true },
      { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', recommended: true },
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
