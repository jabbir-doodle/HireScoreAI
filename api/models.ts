import type { VercelRequest, VercelResponse } from '@vercel/node';

// API Version
const API_VERSION = '2.2.0';

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: { prompt: string; completion: string };
  recommended?: boolean;
  category?: string;
}

// ============================================
// REAL OpenRouter Model IDs (January 2026)
// Verified from: https://openrouter.ai/api/v1/models
// ============================================

const RECOMMENDED_MODELS = [
  // === GPT-5.2 (OpenAI - Latest) ===
  'openai/gpt-5.2-pro',
  'openai/gpt-5.2',
  'openai/gpt-5.2-chat',

  // === Claude 4.5 (Anthropic - Latest) ===
  'anthropic/claude-opus-4.5',
  'anthropic/claude-haiku-4.5',

  // === Gemini 3 (Google - Latest) ===
  'google/gemini-3-pro-preview',
  'google/gemini-3-flash-preview',

  // === DeepSeek V3.2 (Budget-Friendly) ===
  'deepseek/deepseek-v3.2',
  'deepseek/deepseek-v3.2-speciale',

  // === GLM 4.7 (Z.AI - Cheapest) ===
  'z-ai/glm-4.7',

  // === Reasoning Models ===
  'openai/o3-deep-research',
  'openai/o4-mini-deep-research',
];

// Fallback models with REAL IDs
const FALLBACK_MODELS: ModelInfo[] = [
  // === GPT-5.2 Series ===
  {
    id: 'openai/gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    recommended: true,
    category: 'OpenAI',
    description: 'Most advanced GPT - 400K context, best reasoning'
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    recommended: true,
    category: 'OpenAI',
    description: 'Frontier model with adaptive reasoning'
  },
  {
    id: 'openai/gpt-5.2-chat',
    name: 'GPT-5.2 Chat',
    recommended: true,
    category: 'OpenAI',
    description: 'Optimized for conversations'
  },

  // === Claude 4.5 Series ===
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    recommended: true,
    category: 'Anthropic',
    description: 'Best for complex analysis - 80.9% coding accuracy'
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    recommended: true,
    category: 'Anthropic',
    description: 'Fast & efficient - near Sonnet 4 performance'
  },

  // === Gemini 3 Series ===
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    recommended: true,
    category: 'Google',
    description: 'Flagship - 1M token context, multimodal'
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    recommended: true,
    category: 'Google',
    description: 'High-speed, agentic behavior optimized'
  },

  // === Budget-Friendly Models ===
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    recommended: true,
    category: 'DeepSeek',
    description: 'Excellent value - sparse attention architecture'
  },
  {
    id: 'deepseek/deepseek-v3.2-speciale',
    name: 'DeepSeek V3.2 Speciale',
    recommended: true,
    category: 'DeepSeek',
    description: 'High-compute variant for complex tasks'
  },
  {
    id: 'z-ai/glm-4.7',
    name: 'GLM 4.7 (Cheapest)',
    recommended: true,
    category: 'GLM',
    description: 'Best budget option - enhanced programming'
  },

  // === Reasoning Models ===
  {
    id: 'openai/o3-deep-research',
    name: 'o3 Deep Research',
    recommended: true,
    category: 'OpenAI',
    description: 'Advanced reasoning for research tasks'
  },
  {
    id: 'openai/o4-mini-deep-research',
    name: 'o4 Mini Deep Research',
    recommended: true,
    category: 'OpenAI',
    description: 'Efficient reasoning model'
  },
];

function getCategoryFromId(id: string): string {
  if (id.startsWith('openai/')) return 'OpenAI';
  if (id.startsWith('anthropic/')) return 'Anthropic';
  if (id.startsWith('google/')) return 'Google';
  if (id.startsWith('deepseek/') || id.includes('deepseek')) return 'DeepSeek';
  if (id.startsWith('z-ai/') || id.includes('glm')) return 'GLM';
  if (id.startsWith('meta-llama/') || id.startsWith('meta/')) return 'Meta';
  if (id.startsWith('mistralai/')) return 'Mistral';
  if (id.startsWith('x-ai/')) return 'xAI';
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
      return res.json({
        success: true,
        models: FALLBACK_MODELS,
        apiVersion: API_VERSION,
        source: 'fallback'
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('OpenRouter models API error:', response.status);
      return res.json({
        success: true,
        models: FALLBACK_MODELS,
        apiVersion: API_VERSION,
        source: 'fallback-api-error'
      });
    }

    const data = await response.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const models: ModelInfo[] = data.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((m: any) => {
        // Include models that support text generation
        const hasTextOutput = !m.architecture?.output_modalities ||
                             m.architecture.output_modalities.includes('text');
        // Exclude image-only models
        const isTextModel = !m.id.includes('dall-e') &&
                           !m.id.includes('imagen') &&
                           !m.id.includes('-image');
        return hasTextOutput && isTextModel;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const categoryOrder = ['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'GLM', 'xAI', 'Meta', 'Mistral'];
        const aIdx = categoryOrder.indexOf(a.category || 'Other');
        const bIdx = categoryOrder.indexOf(b.category || 'Other');
        if (aIdx !== bIdx) return aIdx - bIdx;
        return (a.name || '').localeCompare(b.name || '');
      });

    res.json({
      success: true,
      models,
      apiVersion: API_VERSION,
      source: 'openrouter-live',
      totalModels: models.length,
      recommendedCount: models.filter(m => m.recommended).length
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.json({
      success: true,
      models: FALLBACK_MODELS,
      apiVersion: API_VERSION,
      source: 'fallback-exception'
    });
  }
}
