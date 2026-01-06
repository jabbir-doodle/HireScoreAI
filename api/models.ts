import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: { prompt: string; completion: string };
  recommended?: boolean;
  category?: string;
}

const RECOMMENDED_MODELS = [
  'anthropic/claude-opus-4.5',
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-haiku-4.5',
  'openai/gpt-5.2-pro',
  'openai/gpt-5.2',
  'openai/gpt-5.2-chat',
  'google/gemini-3-flash-preview',
];

function getCategoryFromId(id: string): string {
  if (id.startsWith('anthropic/')) return 'Anthropic';
  if (id.startsWith('openai/')) return 'OpenAI';
  if (id.startsWith('google/')) return 'Google';
  if (id.startsWith('meta-llama/') || id.startsWith('meta/')) return 'Meta';
  if (id.startsWith('mistralai/')) return 'Mistral';
  if (id.startsWith('deepseek/') || id.includes('deepseek')) return 'DeepSeek';
  if (id.startsWith('bytedance/')) return 'ByteDance';
  if (id.startsWith('nvidia/')) return 'NVIDIA';
  if (id.startsWith('cohere/')) return 'Cohere';
  if (id.startsWith('amazon/')) return 'Amazon';
  return 'Other';
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();

    const models: ModelInfo[] = data.data
      .filter((m: any) => {
        const hasTextOutput = m.architecture?.output_modalities?.includes('text');
        const isRecent = !m.id.includes('2023') && !m.id.includes('deprecated');
        return hasTextOutput && isRecent;
      })
      .map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description?.substring(0, 200),
        contextLength: m.context_length,
        pricing: {
          prompt: m.pricing?.prompt || '0',
          completion: m.pricing?.completion || '0',
        },
        recommended: RECOMMENDED_MODELS.includes(m.id),
        category: getCategoryFromId(m.id),
      }))
      .sort((a: ModelInfo, b: ModelInfo) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

    res.json({ success: true, models });
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return fallback models
    res.json({
      success: true,
      models: [
        { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', recommended: true, category: 'Anthropic' },
        { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', recommended: true, category: 'Anthropic' },
        { id: 'openai/gpt-5.2', name: 'GPT-5.2', recommended: true, category: 'OpenAI' },
        { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', recommended: true, category: 'Google' },
      ]
    });
  }
}
