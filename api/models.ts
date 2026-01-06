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

// REAL OpenRouter model IDs - verified working
const RECOMMENDED_MODELS = [
  'anthropic/claude-3-5-sonnet-20241022',
  'anthropic/claude-3-opus-20240229',
  'anthropic/claude-3-haiku-20240307',
  'openai/gpt-4o',
  'openai/gpt-4-turbo',
  'openai/gpt-4o-mini',
  'google/gemini-1.5-pro',
  'google/gemini-1.5-flash',
];

// Fallback models with REAL IDs
const FALLBACK_MODELS: ModelInfo[] = [
  { id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', recommended: true, category: 'Anthropic', description: 'Best for complex analysis' },
  { id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', recommended: true, category: 'Anthropic', description: 'Most capable Claude model' },
  { id: 'anthropic/claude-3-haiku-20240307', name: 'Claude 3 Haiku', recommended: true, category: 'Anthropic', description: 'Fast and efficient' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', recommended: true, category: 'OpenAI', description: 'Latest GPT-4 model' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', recommended: true, category: 'OpenAI', description: 'Fast GPT-4' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', recommended: true, category: 'OpenAI', description: 'Cost-effective' },
  { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', recommended: true, category: 'Google', description: 'Google\'s best model' },
  { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash', recommended: true, category: 'Google', description: 'Fast Gemini' },
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (_req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      console.log('No API key, returning fallback models');
      return res.json({ success: true, models: FALLBACK_MODELS });
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('OpenRouter models API error:', response.status);
      return res.json({ success: true, models: FALLBACK_MODELS });
    }

    const data = await response.json();

    const models: ModelInfo[] = data.data
      .filter((m: any) => {
        // Include models that support text generation
        const hasTextOutput = !m.architecture?.output_modalities || m.architecture.output_modalities.includes('text');
        // Exclude image-only models
        const isTextModel = !m.id.includes('dall-e') && !m.id.includes('imagen');
        return hasTextOutput && isTextModel;
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
        // Sort recommended first
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        // Then by category
        const categoryOrder = ['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral'];
        const aIdx = categoryOrder.indexOf(a.category || 'Other');
        const bIdx = categoryOrder.indexOf(b.category || 'Other');
        if (aIdx !== bIdx) return aIdx - bIdx;
        return (a.name || '').localeCompare(b.name || '');
      });

    res.json({ success: true, models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.json({ success: true, models: FALLBACK_MODELS });
  }
}
