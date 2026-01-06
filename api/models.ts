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

// LATEST OpenRouter model IDs - January 2026
const RECOMMENDED_MODELS = [
  // === FRONTIER MODELS (Jan 2026) ===
  // GPT-5.2 Series (OpenAI - Dec 2025)
  'openai/gpt-5.2-pro-20251211',
  'openai/gpt-5.2-20251211',
  'openai/gpt-5.2-chat-20251211',
  // Claude 4.5 Series (Anthropic - Nov 2025)
  'anthropic/claude-opus-4.5-20251124',
  'anthropic/claude-4.5-haiku-20251001',
  // Gemini 3 Series (Google - Dec 2025)
  'google/gemini-3-pro-preview-20251117',
  'google/gemini-3-flash-preview-20251217',
  // === BUDGET-FRIENDLY MODELS ===
  // DeepSeek V3.2 (Dec 2025) - Very affordable!
  'deepseek/deepseek-v3.2-20251201',
  'deepseek/deepseek-v3.2-speciale-20251201',
  // GLM 4.7 (Dec 2025) - Z.AI latest
  'z-ai/glm-4.7-20251222',
  // === VISION/OCR MODELS ===
  // Qwen3-VL (Best for PDF OCR - $0.12/M input)
  'qwen/qwen3-vl-235b-a22b-instruct',
];

// Fallback models with LATEST IDs (Jan 2026)
const FALLBACK_MODELS: ModelInfo[] = [
  // === FRONTIER MODELS ===
  // GPT-5.2 (OpenAI - Dec 2025)
  { id: 'openai/gpt-5.2-pro-20251211', name: 'GPT-5.2 Pro', recommended: true, category: 'OpenAI', description: 'Most advanced - 400K context' },
  { id: 'openai/gpt-5.2-20251211', name: 'GPT-5.2', recommended: true, category: 'OpenAI', description: 'Frontier model with adaptive reasoning' },
  { id: 'openai/gpt-5.2-chat-20251211', name: 'GPT-5.2 Chat', recommended: true, category: 'OpenAI', description: 'Fast chat variant' },
  // Claude 4.5 (Anthropic - Nov 2025)
  { id: 'anthropic/claude-opus-4.5-20251124', name: 'Claude Opus 4.5', recommended: true, category: 'Anthropic', description: 'Best for complex analysis - 80.9% coding accuracy' },
  { id: 'anthropic/claude-4.5-haiku-20251001', name: 'Claude 4.5 Haiku', recommended: true, category: 'Anthropic', description: 'Fast & efficient' },
  // Gemini 3 (Google - Dec 2025)
  { id: 'google/gemini-3-pro-preview-20251117', name: 'Gemini 3 Pro', recommended: true, category: 'Google', description: 'Flagship - 1M token context' },
  { id: 'google/gemini-3-flash-preview-20251217', name: 'Gemini 3 Flash', recommended: true, category: 'Google', description: 'High-speed variant' },
  // === BUDGET-FRIENDLY MODELS ===
  // DeepSeek V3.2 (Dec 2025)
  { id: 'deepseek/deepseek-v3.2-20251201', name: 'DeepSeek V3.2', recommended: true, category: 'DeepSeek', description: 'Best value - sparse attention' },
  { id: 'deepseek/deepseek-v3.2-speciale-20251201', name: 'DeepSeek V3.2 Speciale', recommended: true, category: 'DeepSeek', description: 'High-compute variant' },
  // GLM 4.7 (Z.AI - Dec 2025)
  { id: 'z-ai/glm-4.7-20251222', name: 'GLM 4.7', recommended: true, category: 'GLM', description: 'Latest Z.AI - enhanced programming' },
];

function getCategoryFromId(id: string): string {
  if (id.startsWith('openai/')) return 'OpenAI';
  if (id.startsWith('anthropic/')) return 'Anthropic';
  if (id.startsWith('google/')) return 'Google';
  if (id.startsWith('deepseek/') || id.includes('deepseek')) return 'DeepSeek';
  if (id.startsWith('z-ai/') || id.includes('glm')) return 'GLM';
  if (id.startsWith('meta-llama/') || id.startsWith('meta/')) return 'Meta';
  if (id.startsWith('mistralai/')) return 'Mistral';
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
        const categoryOrder = ['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'GLM', 'Meta', 'Mistral'];
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
