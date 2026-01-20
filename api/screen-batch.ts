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

  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { jobDescription, candidates, model } = req.body as {
      jobDescription: string;
      candidates: BatchCandidate[];
      model?: string;
    };

    if (!jobDescription || !candidates || !Array.isArray(candidates)) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and candidates array'
      });
    }

    // Limit batch size to prevent timeout (Vercel has 10s limit for hobby, 60s for pro)
    const MAX_BATCH_SIZE = 10;
    if (candidates.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: `Batch size exceeds limit. Maximum ${MAX_BATCH_SIZE} candidates per request.`,
        suggestion: 'Split into multiple requests or use streaming endpoint'
      });
    }

    const selectedModel = model || 'google/gemini-2.0-flash-001';

    console.log(`[Batch] Processing ${candidates.length} candidates with ${selectedModel}`);

    // Process candidates in parallel for speed
    const results: BatchResult[] = await Promise.all(
      candidates.map(async (candidate, index) => {
        try {
          // Skip if CV content is too short
          if (!candidate.cvContent || candidate.cvContent.length < 50) {
            return {
              name: candidate.name || `Candidate ${index + 1}`,
              success: false,
              error: 'CV content too short or empty'
            };
          }

          const result = await screenSingleCandidate(
            jobDescription,
            candidate.cvContent,
            selectedModel,
            OPENROUTER_API_KEY
          );

          return {
            name: candidate.name || `Candidate ${index + 1}`,
            success: true,
            result
          };
        } catch (error) {
          console.error(`[Batch] Error processing ${candidate.name}:`, error);
          return {
            name: candidate.name || `Candidate ${index + 1}`,
            success: false,
            error: (error as Error).message
          };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Batch] Complete: ${successful} successful, ${failed} failed`);

    return res.json({
      success: true,
      total: candidates.length,
      processed: successful,
      failed,
      results
    });

  } catch (error) {
    console.error('[Batch] Error:', error);
    return res.status(500).json({
      error: 'Batch processing failed',
      message: (error as Error).message
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
