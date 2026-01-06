/**
 * HireScore AI - Enterprise Backend Server
 *
 * This server acts as a secure proxy between the frontend and AI providers.
 * API keys are stored server-side, never exposed to the client.
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// ============================================
// Environment Validation
// ============================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY is not set in environment variables');
  console.error('Please create a .env file with your API key');
  process.exit(1);
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================
// Models Configuration
// ============================================

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: { prompt: string; completion: string };
  recommended?: boolean;
  category?: string;
}

// Cache for models (refresh every 10 minutes)
let modelsCache: ModelInfo[] = [];
let modelsCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Curated list of recommended models for CV screening
const RECOMMENDED_MODELS = [
  'anthropic/claude-opus-4.5',
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-haiku-4.5',
  'openai/gpt-5.2-pro',
  'openai/gpt-5.2',
  'openai/gpt-5.2-chat',
  'google/gemini-3-flash-preview',
];

async function fetchModelsFromOpenRouter(): Promise<ModelInfo[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();

    // Filter and transform models
    const models: ModelInfo[] = data.data
      .filter((m: any) => {
        // Include models that support text generation
        const hasTextOutput = m.architecture?.output_modalities?.includes('text');
        // Exclude deprecated or very old models
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
        // Sort by: recommended first, then by category, then by name
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

    return models;
  } catch (error) {
    console.error('Error fetching models from OpenRouter:', error);
    // Return fallback models
    return [
      { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', recommended: true, category: 'Anthropic' },
      { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', recommended: true, category: 'Anthropic' },
      { id: 'openai/gpt-5.2', name: 'GPT-5.2', recommended: true, category: 'OpenAI' },
      { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', recommended: true, category: 'Google' },
    ];
  }
}

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

// Fetch models endpoint (for dynamic model selection)
app.get('/api/models', async (_req, res) => {
  try {
    const now = Date.now();

    // Check if cache is valid
    if (modelsCache.length > 0 && (now - modelsCacheTime) < CACHE_DURATION) {
      return res.json({ success: true, models: modelsCache, cached: true });
    }

    // Fetch fresh models
    modelsCache = await fetchModelsFromOpenRouter();
    modelsCacheTime = now;

    res.json({ success: true, models: modelsCache, cached: false });
  } catch (error) {
    console.error('Error in /api/models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// AI Configuration (returns available models without exposing keys)
app.get('/api/config', async (_req, res) => {
  try {
    // Use cached models if available, otherwise fetch
    if (modelsCache.length === 0) {
      modelsCache = await fetchModelsFromOpenRouter();
      modelsCacheTime = Date.now();
    }

    // Return only recommended models for quick selection
    const quickModels = modelsCache.filter(m => m.recommended).slice(0, 10);

    res.json({
      provider: 'openrouter',
      models: quickModels.length > 0 ? quickModels : [
        { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', recommended: true },
        { id: 'openai/gpt-5.2', name: 'GPT-5.2', recommended: true },
      ],
      features: {
        screening: true,
        batchProcessing: true,
        maxCVsPerBatch: 50,
      }
    });
  } catch (error) {
    console.error('Error in /api/config:', error);
    // Return fallback config
    res.json({
      provider: 'openrouter',
      models: [
        { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', recommended: true },
      ],
      features: {
        screening: true,
        batchProcessing: true,
        maxCVsPerBatch: 50,
      }
    });
  }
});

// Proxy endpoint to fetch content from external URLs (avoids CORS issues)
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch URL: ${response.statusText}`
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // If HTML, try to extract meaningful text
    let content = text;
    if (contentType.includes('text/html')) {
      // Simple HTML to text extraction
      content = text
        // Remove script and style elements
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        // Remove HTML tags
        .replace(/<[^>]+>/g, ' ')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
    }

    res.json({
      success: true,
      content,
      contentType,
      url,
    });
  } catch (error) {
    console.error('URL fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch URL',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Screen a single candidate
app.post('/api/screen', async (req, res) => {
  try {
    const { jobDescription, cvContent, model = 'anthropic/claude-3.5-sonnet' } = req.body;

    if (!jobDescription || !cvContent) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and cvContent'
      });
    }

    const prompt = `You are an expert HR recruiter screening CVs. Analyze this candidate.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE CV:
${cvContent}

---

Provide your analysis in the following JSON format:
{
  "score": <number 0-100>,
  "recommendation": "<interview|maybe|pass>",
  "summary": "<2-3 sentence summary>",
  "matchedSkills": ["<skill1>", "<skill2>", ...],
  "missingSkills": ["<skill1>", "<skill2>", ...],
  "concerns": ["<concern1>", ...],
  "interviewQuestions": ["<question1>", "<question2>", "<question3>"],
  "experienceYears": <number>
}

Be objective and thorough. Return ONLY valid JSON.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'HireScore AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return res.status(response.status).json({
        error: 'AI service temporarily unavailable',
        details: process.env.NODE_ENV === 'development' ? errorData : undefined
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse JSON from response
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const result = JSON.parse(jsonStr);
      res.json({
        success: true,
        result,
        usage: data.usage,
      });
    } catch (parseError) {
      // If JSON parsing fails, return structured error
      res.json({
        success: true,
        result: {
          score: 50,
          recommendation: 'maybe',
          summary: content.substring(0, 200),
          matchedSkills: [],
          missingSkills: [],
          concerns: ['Could not parse AI response'],
          interviewQuestions: [],
          experienceYears: 0,
          rawResponse: content,
        },
        usage: data.usage,
      });
    }

  } catch (error) {
    console.error('Screening error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Batch screen multiple candidates
app.post('/api/screen/batch', async (req, res) => {
  try {
    const { jobDescription, candidates, model = 'anthropic/claude-3.5-sonnet' } = req.body;

    if (!jobDescription || !candidates || !Array.isArray(candidates)) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and candidates array'
      });
    }

    if (candidates.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 candidates per batch'
      });
    }

    // Process candidates in parallel (with concurrency limit)
    const results = [];
    const concurrency = 5;

    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (candidate: { name: string; cvContent: string }) => {
          try {
            const prompt = `You are an expert HR recruiter. Analyze this candidate briefly.

JOB: ${jobDescription.substring(0, 1000)}

CV: ${candidate.cvContent.substring(0, 3000)}

Return JSON only:
{"score":<0-100>,"recommendation":"<interview|maybe|pass>","summary":"<1 sentence>","matchedSkills":["skill1"],"missingSkills":["skill1"],"concerns":[],"interviewQuestions":["q1"],"experienceYears":<num>}`;

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'HireScore AI',
              },
              body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 500,
              }),
            });

            if (!response.ok) {
              throw new Error('AI request failed');
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '{}';

            let result;
            try {
              let jsonStr = content;
              const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
              if (jsonMatch) jsonStr = jsonMatch[1];
              result = JSON.parse(jsonStr);
            } catch {
              result = { score: 50, recommendation: 'maybe', summary: 'Parse error' };
            }

            return {
              name: candidate.name,
              success: true,
              ...result,
            };
          } catch (error) {
            return {
              name: candidate.name,
              success: false,
              score: 0,
              recommendation: 'pass',
              summary: 'Processing failed',
              error: (error as Error).message,
            };
          }
        })
      );
      results.push(...batchResults);
    }

    res.json({
      success: true,
      total: candidates.length,
      processed: results.length,
      results,
    });

  } catch (error) {
    console.error('Batch screening error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Error Handling
// ============================================

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           HireScore AI - Backend Server           ║
╠═══════════════════════════════════════════════════╣
║  Status:     RUNNING                              ║
║  Port:       ${String(PORT).padEnd(37)}║
║  Mode:       ${(process.env.NODE_ENV || 'development').padEnd(37)}║
║  API Key:    ${'*'.repeat(8)}...${OPENROUTER_API_KEY.slice(-4).padEnd(25)}║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
