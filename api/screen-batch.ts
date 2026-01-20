import type { VercelRequest, VercelResponse } from '@vercel/node';

interface BatchCandidate {
  name: string;
  cvContent: string;
}

interface BatchResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
  retries?: number;
  latencyMs?: number;
}

// 2026 Fastest Models for Bulk Processing (Jan 2026)
const FAST_MODELS = {
  // Gemini 2.5 Flash-Lite: $0.1/M input - fastest, cheapest
  'gemini-flash-lite': 'google/gemini-2.5-flash-lite',
  // Gemini 2.0 Flash: $0.1/M input - fast, reliable
  'gemini-flash': 'google/gemini-2.0-flash-001',
  // DeepSeek V3.2: $0.14/M input - value king
  'deepseek': 'deepseek/deepseek-chat-v3-0324',
  // GLM-4: Free tier available
  'glm': 'thudm/glm-z1-32b',
};

// Exponential backoff retry helper
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 500
): Promise<{ result: T; retries: number }> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retries: attempt };
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1s, 2s
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { jobDescription, candidates, model, fastMode } = req.body as {
      jobDescription: string;
      candidates: BatchCandidate[];
      model?: string;
      fastMode?: boolean;
    };

    if (!jobDescription || !candidates || !Array.isArray(candidates)) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and candidates array'
      });
    }

    // Limit batch size to prevent timeout (Vercel has 10s limit for hobby, 60s for pro)
    const MAX_BATCH_SIZE = 5; // Reduced for reliability
    if (candidates.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: `Batch size exceeds limit. Maximum ${MAX_BATCH_SIZE} candidates per request.`,
        suggestion: 'Split into multiple requests for better reliability'
      });
    }

    // Use fastest model for bulk processing (Gemini 2.5 Flash-Lite)
    const selectedModel = model || (fastMode ? FAST_MODELS['gemini-flash-lite'] : FAST_MODELS['gemini-flash']);

    console.log(`[Batch] Processing ${candidates.length} candidates with ${selectedModel} (fastMode: ${fastMode})`);

    // Process candidates in parallel with retry logic
    const results: BatchResult[] = await Promise.all(
      candidates.map(async (candidate, index) => {
        const candidateStart = Date.now();
        try {
          // Skip if CV content is too short
          if (!candidate.cvContent || candidate.cvContent.length < 50) {
            return {
              name: candidate.name || `Candidate ${index + 1}`,
              success: false,
              error: 'CV content too short or empty',
              latencyMs: Date.now() - candidateStart
            };
          }

          const { result, retries } = await withRetry(
            () => screenSingleCandidate(
              jobDescription,
              candidate.cvContent,
              selectedModel,
              OPENROUTER_API_KEY
            ),
            2, // Max 2 retries
            300 // Start with 300ms delay
          );

          return {
            name: candidate.name || `Candidate ${index + 1}`,
            success: true,
            result,
            retries,
            latencyMs: Date.now() - candidateStart
          };
        } catch (error) {
          console.error(`[Batch] Error processing ${candidate.name}:`, error);
          return {
            name: candidate.name || `Candidate ${index + 1}`,
            success: false,
            error: (error as Error).message,
            latencyMs: Date.now() - candidateStart
          };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalLatency = Date.now() - startTime;
    const avgLatency = Math.round(results.reduce((sum, r) => sum + (r.latencyMs || 0), 0) / results.length);

    console.log(`[Batch] Complete: ${successful}/${candidates.length} in ${totalLatency}ms (avg ${avgLatency}ms/CV)`);

    return res.json({
      success: true,
      total: candidates.length,
      processed: successful,
      failed,
      results,
      performance: {
        totalMs: totalLatency,
        avgPerCvMs: avgLatency,
        model: selectedModel
      }
    });

  } catch (error) {
    console.error('[Batch] Error:', error);
    return res.status(500).json({
      error: 'Batch processing failed',
      message: (error as Error).message,
      latencyMs: Date.now() - startTime
    });
  }
}

// Reusable single candidate screening function
async function screenSingleCandidate(
  jobDescription: string,
  cvContent: string,
  model: string,
  apiKey: string
): Promise<any> {
  const prompt = buildScreeningPrompt(jobDescription, cvContent);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://rankhr.vercel.app',
      'X-Title': 'HireScore AI Batch',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR recruiter. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse JSON from response
  let jsonStr = content.trim();
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  return JSON.parse(jsonStr);
}

// Compact prompt for batch processing (saves tokens)
function buildScreeningPrompt(jobDescription: string, cvContent: string): string {
  return `Analyze CV against JD. Return JSON only.

SKILL MATCHES: React=React.js=ReactJS, Node.js=NodeJS=Express, AWS=EC2/S3/Lambda, TypeScript=TS
PARTIAL (70%): React↔Vue↔Angular, AWS↔GCP↔Azure, PostgreSQL↔MySQL

SCORING: Technical(35)+Experience(25)+Education(15)+Progression(15)+Communication(10)
CAPS: 1 required missing→max 75, 2+→max 55, 3+→max 40

JOB:
${jobDescription}

CV:
${cvContent}

OUTPUT JSON:
{
  "score": 0-100,
  "confidence": 0.0-1.0,
  "recommendation": "interview|maybe|pass",
  "summary": "2-3 sentences",
  "scoreBreakdown": {"technicalSkills":0-35,"experience":0-25,"education":0-15,"careerProgression":0-15,"communication":0-10},
  "matchedSkills": ["skill1","skill2"],
  "missingSkills": ["skill1"],
  "strengths": ["top strength"],
  "concerns": ["concern if any"],
  "interviewQuestions": ["question based on this CV and JD"],
  "experienceYears": number,
  "skillMatchPercent": number
}`;
}
