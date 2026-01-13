import type { VercelRequest, VercelResponse } from '@vercel/node';

interface OpenRouterKeyInfo {
  data: {
    label?: string;
    usage: number; // Credits used in USD
    limit: number | null; // Credit limit in USD, null = unlimited
    is_free_tier: boolean;
    rate_limit: {
      requests: number;
      interval: string;
    };
  };
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
      return res.status(400).json({
        success: false,
        error: 'API key not configured',
      });
    }

    // Fetch key info from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('OpenRouter credits API error:', response.status);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to fetch credits from OpenRouter',
      });
    }

    const data: OpenRouterKeyInfo = await response.json();

    // Calculate remaining credits
    const used = data.data.usage || 0;
    const limit = data.data.limit;
    const remaining = limit !== null ? limit - used : null;

    res.json({
      success: true,
      credits: {
        used: used,
        limit: limit,
        remaining: remaining,
        isUnlimited: limit === null,
        isFreeTier: data.data.is_free_tier,
        label: data.data.label || 'OpenRouter API',
      },
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits',
    });
  }
}
