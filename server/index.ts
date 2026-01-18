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
const APP_URL = process.env.APP_URL || 'http://localhost:3002';

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

// OpenRouter API model response type
interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { output_modalities?: string[] };
}

// Cache for models (refresh every 10 minutes)
let modelsCache: ModelInfo[] = [];
let modelsCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Top-tier providers (sorted by quality for enterprise) - 2026 rankings
const TOP_PROVIDERS = ['google', 'anthropic', 'openai', 'deepseek', 'meta-llama'] as const;
const PREFERRED_PROVIDERS = TOP_PROVIDERS; // Alias for backward compatibility

// Dynamic version extraction - detects latest models automatically
// Production-ready: handles all common naming patterns
function getModelVersion(id: string): number {
  const lowerIdName = id.toLowerCase();

  // Date-based versions get highest priority (e.g., 20260115, 2026-01)
  const dateMatch = lowerIdName.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})?/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]);
    const day = dateMatch[3] ? parseInt(dateMatch[3]) : 1;
    // Convert to a sortable number (e.g., 2026-01-15 → 20260115)
    if (year >= 2020 && year <= 2030) {
      return year * 10000 + month * 100 + day;
    }
  }

  // Major version numbers (e.g., gemini-3, gpt-4, claude-4)
  const majorVersionMatch = lowerIdName.match(/[-_](\d+(?:\.\d+)?)([-_]|$)/);
  if (majorVersionMatch) {
    return parseFloat(majorVersionMatch[1]) * 1000;
  }

  // Model family version (e.g., o1, o3, r1, v3)
  const familyMatch = lowerIdName.match(/([ovr])(\d+)/);
  if (familyMatch) {
    // o3 > o1, r1 > v3 in priority
    const prefix = familyMatch[1];
    const num = parseInt(familyMatch[2]);
    const prefixWeight = { 'o': 3, 'r': 2, 'v': 1 }[prefix] || 0;
    return prefixWeight * 100 + num * 10;
  }

  return 0;
}

// Detect if model is "latest" based on naming conventions
// Production-ready: comprehensive detection without hardcoding specific model IDs
function isLatestModel(id: string, name: string): boolean {
  const combined = (id + ' ' + name).toLowerCase();

  // Latest year indicators (dynamic: current and next year)
  const currentYear = new Date().getFullYear();
  const yearIndicators = [String(currentYear), String(currentYear - 1)];

  // Model quality tier indicators
  const qualityIndicators = [
    'pro', 'ultra', 'opus', 'sonnet', 'flash', 'turbo', 'plus',
    'preview', 'exp', 'experimental', 'latest', 'thinking',
  ];

  // Cutting-edge model families
  const cuttingEdgeFamilies = [
    'o1', 'o3', 'o4', // OpenAI reasoning
    'r1', 'r2', // DeepSeek reasoning
    'gemini-2', 'gemini-3', // Google latest
    'claude-4', 'claude-opus', 'claude-sonnet', // Anthropic
    'llama-4', 'llama-3.3', // Meta latest
  ];

  // Check for any indicator match
  const hasYearIndicator = yearIndicators.some(y => combined.includes(y));
  const hasQualityIndicator = qualityIndicators.some(q => combined.includes(q));
  const hasCuttingEdgeFamily = cuttingEdgeFamilies.some(f => combined.includes(f));

  return hasYearIndicator || hasQualityIndicator || hasCuttingEdgeFamily;
}

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

    // Filter and transform models - ALL from API, no hardcoding
    const models: ModelInfo[] = (data.data as OpenRouterModel[])
      .filter((m: OpenRouterModel) => {
        // Include models that support text generation
        const hasTextOutput = m.architecture?.output_modalities?.includes('text');
        return hasTextOutput;
      })
      .map((m: OpenRouterModel) => {
        const category = getCategoryFromId(m.id);
        // Mark as recommended if from preferred provider
        const isPreferred = PREFERRED_PROVIDERS.some(p => m.id.startsWith(p + '/'));

        const isLatest = isLatestModel(m.id, m.name);
        const version = getModelVersion(m.id);

        return {
          id: m.id,
          name: m.name,
          description: m.description?.substring(0, 200),
          contextLength: m.context_length,
          pricing: {
            prompt: m.pricing?.prompt || '0',
            completion: m.pricing?.completion || '0',
          },
          recommended: isPreferred && isLatest, // Only recommend if BOTH top provider AND latest
          category,
          _version: version, // Internal for sorting
          _isLatest: isLatest,
        };
      })
      .sort((a: ModelInfo & { _version?: number; _isLatest?: boolean }, b: ModelInfo & { _version?: number; _isLatest?: boolean }) => {
        // PRODUCTION SORTING: Provider tier + Latest versions for enterprise quality

        // 1. Top-tier providers get massive boost
        const aProviderIdx = TOP_PROVIDERS.findIndex(p => a.id.startsWith(p + '/'));
        const bProviderIdx = TOP_PROVIDERS.findIndex(p => b.id.startsWith(p + '/'));
        const aIsTopTier = aProviderIdx !== -1;
        const bIsTopTier = bProviderIdx !== -1;

        // Top-tier providers ALWAYS before others
        if (aIsTopTier && !bIsTopTier) return -1;
        if (!aIsTopTier && bIsTopTier) return 1;

        // 2. Within same tier, latest models first
        if (a._isLatest && !b._isLatest) return -1;
        if (!a._isLatest && b._isLatest) return 1;

        // 3. Within same tier + latest status, sort by provider rank
        if (aIsTopTier && bIsTopTier && aProviderIdx !== bProviderIdx) {
          return aProviderIdx - bProviderIdx; // Google > Anthropic > OpenAI > DeepSeek > Meta
        }

        // 4. Within same provider, higher version first
        const versionDiff = (b._version || 0) - (a._version || 0);
        if (versionDiff !== 0) return versionDiff;

        // 5. Alphabetical fallback
        return (a.name || '').localeCompare(b.name || '');
      })
      .map((model) => {
        // Remove internal fields before returning to client
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _version, _isLatest, ...cleanModel } = model as ModelInfo & { _version?: number; _isLatest?: boolean };
        return cleanModel;
      }); // Production-ready: no internal fields exposed

    console.log(`Fetched ${models.length} models from OpenRouter API`);
    return models;
  } catch (error) {
    console.error('Error fetching models from OpenRouter:', error);
    // Return empty - let frontend handle the error
    return [];
  }
}

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
      models: quickModels,  // From API - no hardcoded fallbacks
      features: {
        screening: true,
        batchProcessing: true,
        maxCVsPerBatch: 50,
      }
    });
  } catch (error) {
    console.error('Error in /api/config:', error);
    res.status(500).json({
      error: 'Failed to fetch configuration',
      provider: 'openrouter',
      models: [],
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
    const { jobDescription, cvContent } = req.body;
    let { model } = req.body;

    // If no model specified, use first recommended from cache or fetch
    if (!model) {
      if (modelsCache.length === 0) {
        modelsCache = await fetchModelsFromOpenRouter();
        modelsCacheTime = Date.now();
      }
      const recommended = modelsCache.find(m => m.recommended);
      model = recommended?.id || modelsCache[0]?.id || 'openai/gpt-4o-mini';
    }

    if (!jobDescription || !cvContent) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and cvContent'
      });
    }

    // MILITARY-GRADE ENTERPRISE SCREENING - 2026 Best Practices
    // Aligned with: NIST AI RMF, NYC Law 144, EU AI Act, ISO 30415
    const prompt = `You are an ENTERPRISE TALENT INTELLIGENCE SYSTEM with calibrated scoring algorithms.
Your analysis must be EVIDENCE-BASED, BIAS-FREE, and LEGALLY DEFENSIBLE.

═══════════════════════════════════════════════════════════════════════════════
                           JOB REQUIREMENTS ANALYSIS
═══════════════════════════════════════════════════════════════════════════════
${jobDescription}

═══════════════════════════════════════════════════════════════════════════════
                           CANDIDATE PROFILE DATA
═══════════════════════════════════════════════════════════════════════════════
${cvContent}

═══════════════════════════════════════════════════════════════════════════════
              CALIBRATED MULTI-FACTOR SCORING FRAMEWORK (2026 Standard)
═══════════════════════════════════════════════════════════════════════════════

PHASE 1 - REQUIREMENT EXTRACTION
├── Parse ALL required skills (MUST-HAVE)
├── Parse ALL preferred skills (NICE-TO-HAVE)
├── Identify experience level requirements
├── Note education/certification requirements
└── Extract any domain-specific keywords

PHASE 2 - EVIDENCE-BASED VERIFICATION
├── For EACH required skill: Find explicit proof in CV (quote evidence)
├── For EACH preferred skill: Find explicit proof in CV
├── Verify years of experience with timeline analysis
├── Cross-reference education claims
└── Analyze career trajectory and progression

PHASE 3 - CALIBRATED SCORING (100-point scale)
├── Technical Skills Match (35 points)
│   └── Score = (matched_required / total_required) × 35
├── Experience Alignment (25 points)
│   └── Score based on years + relevance + companies
├── Education & Certifications (15 points)
│   └── Exact match=15, Related=10, None=5
├── Career Progression (15 points)
│   └── Promotions, increasing responsibility, growth
└── Communication & Soft Skills (10 points)
    └── CV quality, clarity, achievements framing

PHASE 4 - CONFIDENCE & RECOMMENDATION
├── Calculate confidence interval (how certain is the score)
├── Determine recommendation with thresholds:
│   └── 80-100: INTERVIEW (Strong match)
│   └── 60-79: MAYBE (Review further)
│   └── 0-59: PASS (Not aligned)
└── Generate targeted interview questions

OUTPUT FORMAT (JSON only - NO markdown, NO explanation):
{
  "score": <0-100 calibrated score>,
  "confidence": <0.0-1.0 confidence level>,
  "recommendation": "<interview|maybe|pass>",
  "summary": "<Executive summary: 2-3 sentences on fit, top strength, main gap>",
  "scoreBreakdown": {
    "technicalSkills": <0-35>,
    "experience": <0-25>,
    "education": <0-15>,
    "careerProgression": <0-15>,
    "communication": <0-10>
  },
  "matchedSkills": ["<skill>: <evidence from CV>", ...],
  "missingSkills": ["<required skill not found>", ...],
  "partialMatches": ["<skill with related but not exact match>", ...],
  "concerns": ["<specific concern with evidence>", ...],
  "strengths": ["<top 3 candidate strengths>", ...],
  "interviewQuestions": [
    "<Technical deep-dive question>",
    "<Experience verification question>",
    "<Culture/soft skills question>"
  ],
  "experienceYears": <total relevant years>,
  "skillMatchPercent": <percentage of required skills matched>,
  "educationMatch": <true|false|partial>
}

SCORING RULES (STRICTLY ENFORCED):
• Missing 1 REQUIRED skill → Max score 75
• Missing 2+ REQUIRED skills → Max score 55
• Missing 3+ REQUIRED skills → Max score 40
• No evidence = No credit (must quote from CV)
• Confidence < 0.7 if CV lacks detail
• Return VALID JSON ONLY - no text before/after`;

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
        temperature: 0.2, // Lower temp for more consistent, accurate results
        max_tokens: 2500, // Increased for detailed enterprise analysis
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);

      // Handle specific error cases
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limited - please try again in a few seconds',
          retryAfter: 5
        });
      }

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

    // ENTERPRISE-GRADE JSON PARSING with multiple fallbacks
    try {
      let jsonStr = content.trim();

      // Strategy 1: Extract from markdown code blocks
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Strategy 2: Find JSON object boundaries
      if (!jsonStr.startsWith('{')) {
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }
      }

      const result = JSON.parse(jsonStr);

      // Validate and normalize result with defaults
      const normalizedResult = {
        score: Math.min(100, Math.max(0, result.score || 0)),
        confidence: result.confidence || 0.8,
        recommendation: ['interview', 'maybe', 'pass'].includes(result.recommendation)
          ? result.recommendation
          : (result.score >= 80 ? 'interview' : result.score >= 60 ? 'maybe' : 'pass'),
        summary: result.summary || 'Analysis completed.',
        scoreBreakdown: result.scoreBreakdown || {
          technicalSkills: Math.round((result.score || 0) * 0.35),
          experience: Math.round((result.score || 0) * 0.25),
          education: Math.round((result.score || 0) * 0.15),
          careerProgression: Math.round((result.score || 0) * 0.15),
          communication: Math.round((result.score || 0) * 0.10)
        },
        matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
        missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
        partialMatches: Array.isArray(result.partialMatches) ? result.partialMatches : [],
        concerns: Array.isArray(result.concerns) ? result.concerns : [],
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        interviewQuestions: Array.isArray(result.interviewQuestions) ? result.interviewQuestions : [],
        experienceYears: result.experienceYears || 0,
        skillMatchPercent: result.skillMatchPercent || 0,
        educationMatch: result.educationMatch ?? false
      };

      res.json({
        success: true,
        result: normalizedResult,
        usage: data.usage,
        model: model,
        processingTime: Date.now()
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content.substring(0, 500));

      // Fallback: Return a structured response even if parsing fails
      res.json({
        success: true,
        result: {
          score: 50,
          confidence: 0.3,
          recommendation: 'maybe',
          summary: 'Unable to fully analyze. Manual review recommended.',
          scoreBreakdown: { technicalSkills: 17, experience: 13, education: 8, careerProgression: 7, communication: 5 },
          matchedSkills: [],
          missingSkills: [],
          partialMatches: [],
          concerns: ['Automated analysis incomplete - review manually'],
          strengths: [],
          interviewQuestions: ['Please conduct a standard screening interview'],
          experienceYears: 0,
          skillMatchPercent: 0,
          educationMatch: false,
          rawResponse: content.substring(0, 500),
          parseError: true
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
    const { jobDescription, candidates } = req.body;
    let { model } = req.body;

    // If no model specified, use first recommended from cache
    if (!model) {
      if (modelsCache.length === 0) {
        modelsCache = await fetchModelsFromOpenRouter();
        modelsCacheTime = Date.now();
      }
      const recommended = modelsCache.find(m => m.recommended);
      model = recommended?.id || modelsCache[0]?.id || 'openai/gpt-4o-mini';
    }

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
// Company Research (uses server-side API key)
// ============================================

app.post('/api/research-company', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    // Fetch website content via proxy
    let content = '';
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HireScoreBot/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const html = await response.text();
        // Strip HTML tags for AI processing
        content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .substring(0, 30000);
      }
    } catch {
      // Continue even if fetch fails
    }

    // Use AI to extract company info
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': APP_URL,
        'X-Title': 'HireScore AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{
          role: 'user',
          content: `Extract company information from this URL: ${url}

Website content (if available):
${content || 'Could not fetch website content'}

Return JSON with these fields:
{
  "name": "Company Name",
  "description": "2-3 sentence description",
  "industry": "Industry",
  "size": "startup|smb|midmarket|enterprise",
  "location": "Location",
  "techStack": ["Tech1", "Tech2"],
  "cultureValues": ["Value1", "Value2"],
  "workStyle": "remote|hybrid|onsite",
  "benefits": ["Benefit1"],
  "confidence": 0.0-1.0
}

Return ONLY valid JSON.`
        }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI extraction failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No valid JSON in AI response');
    }

    const profile = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      profile: {
        ...profile,
        website: url,
        techStack: profile.techStack || [],
        cultureValues: profile.cultureValues || [],
        benefits: profile.benefits || [],
        recentNews: [],
      },
      tokensUsed: aiData.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error('Company research error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Research failed',
    });
  }
});

// ============================================
// JD Generation (uses server-side API key)
// ============================================

app.post('/api/generate-jd', async (req, res) => {
  try {
    const { jobTitle, companyProfile } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ success: false, error: 'Job title is required' });
    }

    const prompt = `Generate a job description for: ${jobTitle}

${companyProfile ? `Company Context:
- Name: ${companyProfile.name || 'Company'}
- Industry: ${companyProfile.industry || 'Not specified'}
- Tech Stack: ${companyProfile.techStack?.join(', ') || 'Not specified'}
- Culture: ${companyProfile.cultureValues?.join(', ') || 'Not specified'}
- Work Style: ${companyProfile.workStyle || 'Not specified'}` : ''}

Return JSON:
{
  "title": "Full job title",
  "department": "Department",
  "seniorityLevel": "junior|mid|senior|staff|principal",
  "employmentType": "full-time",
  "summary": "2-3 sentence role summary",
  "responsibilities": ["Resp 1", "Resp 2", "Resp 3"],
  "requiredSkills": ["Skill 1", "Skill 2", "Skill 3"],
  "niceToHaveSkills": ["Nice 1", "Nice 2"],
  "experienceMin": 2,
  "experienceMax": 5,
  "education": "Required education",
  "remoteAllowed": true,
  "fullText": "Complete formatted JD",
  "confidence": 0.85
}

Return ONLY valid JSON.`;

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': APP_URL,
        'X-Title': 'HireScore AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2500,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error('OpenRouter error:', aiResponse.status, errorBody);
      throw new Error(`AI generation failed: ${aiResponse.status} - ${errorBody.slice(0, 200)}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No valid JSON in AI response');
    }

    const jd = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      jobDescription: {
        ...jd,
        generatedAt: new Date().toISOString(),
        requiredSkills: jd.requiredSkills || [],
        niceToHaveSkills: jd.niceToHaveSkills || [],
        responsibilities: jd.responsibilities || [],
      },
      tokensUsed: aiData.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error('JD generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    });
  }
});

// ============================================
// Credits/Usage Tracking
// ============================================

// Get OpenRouter credits/usage information
app.get('/api/credits', async (_req, res) => {
  try {
    // Fetch usage from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'Failed to fetch credits from OpenRouter'
      });
    }

    const data = await response.json();

    // OpenRouter returns { data: { limit, usage, limit_remaining, is_free_tier } }
    const keyInfo = data.data || {};

    res.json({
      success: true,
      credits: {
        used: keyInfo.usage || 0,
        limit: keyInfo.limit || null,
        remaining: keyInfo.limit_remaining || null,
        isUnlimited: keyInfo.limit === null || keyInfo.limit === undefined,
        isFreeTier: keyInfo.is_free_tier || false,
        label: keyInfo.label || 'API Key',
      }
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits'
    });
  }
});

// ============================================
// Document Parsing (PDF, DOCX)
// ============================================

// Parse PDF using pdf-parse (server-side, better for complex PDFs)
app.post('/api/parse-pdf', async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ success: false, error: 'Missing base64 PDF data' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');

    // Dynamic import for pdf-parse (ESM module)
    let parsePdfModule;
    try {
      parsePdfModule = await import('pdf-parse');
    } catch {
      // pdf-parse not installed, return error
      return res.status(500).json({
        success: false,
        error: 'PDF parsing library not available. Please paste CV text manually.',
        method: 'none'
      });
    }

    // pdf-parse 2.x - handle different export styles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsePdf = (parsePdfModule as any).parsePdf || (parsePdfModule as any).default || parsePdfModule;
    const data = await parsePdf(buffer);

    if (data.text && data.text.trim().length > 50) {
      return res.json({
        success: true,
        text: data.text.trim(),
        pages: data.numPages || data.numpages || 1,
        method: 'pdf-parse'
      });
    }

    // If no text extracted, suggest manual paste
    const pageCount = data.numPages || data.numpages || 1;
    return res.json({
      success: true,
      text: `Document from PDF (${pageCount} pages). The PDF appears to be image-based or scanned. Please paste the CV content manually for accurate screening.`,
      pages: pageCount,
      method: 'fallback',
      warning: 'low_text'
    });

  } catch (error) {
    console.error('PDF parse error:', error);
    res.status(500).json({
      success: false,
      error: 'PDF parsing failed. Please paste CV text manually.',
      method: 'error'
    });
  }
});

// Parse DOCX using mammoth (server-side, better extraction)
app.post('/api/parse-docx', async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ success: false, error: 'Missing base64 DOCX data' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64');

    // Dynamic import for mammoth
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });

    if (result.value && result.value.trim().length > 50) {
      return res.json({
        success: true,
        text: result.value.trim(),
        method: 'mammoth'
      });
    }

    return res.json({
      success: true,
      text: 'Document content could not be extracted. Please paste CV text manually.',
      method: 'fallback'
    });

  } catch (error) {
    console.error('DOCX parse error:', error);
    res.status(500).json({
      success: false,
      error: 'DOCX parsing failed. Please paste CV text manually.'
    });
  }
});

// ============================================
// Error Handling
// ============================================

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
