import type { VercelRequest, VercelResponse } from '@vercel/node';

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
      console.error('OPENROUTER_API_KEY not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { jobDescription, cvContent, model } = req.body;

    // Default to GLM 4.7 (cheapest) - user can select premium models if needed
    const selectedModel = model || 'z-ai/glm-4.7-20251222';

    if (!jobDescription || !cvContent) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and cvContent'
      });
    }

    // Check if CV content is actually meaningful
    if (cvContent.length < 100 || cvContent.includes('[PDF File:')) {
      return res.status(400).json({
        error: 'CV content is empty or could not be read. Please paste the CV text directly or use a text file.'
      });
    }

    console.log('Screening request:', {
      model: selectedModel,
      jdLength: jobDescription.length,
      cvLength: cvContent.length,
    });

    const prompt = `You are a SENIOR HR DIRECTOR with 20+ years of talent acquisition experience. Your analysis must be PRECISE, OBJECTIVE, and ACTIONABLE.

══════════════════════════════════════════════════════════════
                        JOB REQUIREMENTS
══════════════════════════════════════════════════════════════
${jobDescription}

══════════════════════════════════════════════════════════════
                      CANDIDATE CV/RESUME
══════════════════════════════════════════════════════════════
${cvContent}

══════════════════════════════════════════════════════════════
                    MILITARY-GRADE ANALYSIS
══════════════════════════════════════════════════════════════

STEP 1 - EXTRACT REQUIREMENTS (from job description):
- List ALL required skills mentioned
- List ALL preferred/nice-to-have skills
- Note minimum experience required
- Note education requirements

STEP 2 - CROSS-CHECK CANDIDATE (from CV):
- For EACH required skill, verify if candidate has it (with evidence)
- Calculate years of RELEVANT experience (not total career)
- Verify education matches requirements
- Check for career progression and stability

STEP 3 - SCORING MATRIX (be STRICT):
┌─────────────────────────────────────┬────────┐
│ Criteria                            │ Weight │
├─────────────────────────────────────┼────────┤
│ Required Skills Match               │ 40%    │
│ Relevant Experience (years + depth) │ 25%    │
│ Education & Certifications          │ 15%    │
│ Career Progression & Stability      │ 10%    │
│ Culture Fit Indicators              │ 10%    │
└─────────────────────────────────────┴────────┘

STEP 4 - RED FLAG CHECK:
- Employment gaps > 6 months
- Job hopping (< 1 year at multiple roles)
- Overqualified (may leave quickly)
- Underqualified for seniority level
- Missing critical certifications

STEP 5 - OUTPUT (JSON only):
{
  "score": <0-100 based on weighted matrix above>,
  "recommendation": "<interview|maybe|pass>",
  "summary": "<3 sentences: 1) Overall fit 2) Key strength 3) Main concern>",
  "matchedSkills": ["<skill from JD that candidate HAS with proof>", ...],
  "missingSkills": ["<REQUIRED skill from JD that candidate LACKS>", ...],
  "concerns": ["<specific red flag with evidence>", ...],
  "interviewQuestions": [
    "<question to verify a claimed skill>",
    "<question about a potential concern>",
    "<behavioral question for culture fit>"
  ],
  "experienceYears": <RELEVANT experience only, not total>,
  "skillMatchPercent": <percentage of required skills matched>,
  "educationMatch": <true if meets minimum education requirement, false otherwise>
}

SCORING GUIDE (BE STRICT - HR budgets depend on accuracy):
- 85-100: EXCELLENT - Schedule interview immediately
- 70-84: GOOD - Worth interviewing, minor gaps
- 55-69: MAYBE - Consider if talent pool is limited
- 40-54: WEAK - Significant gaps, likely not suitable
- 0-39: PASS - Does not meet minimum requirements

CRITICAL RULES:
1. NEVER inflate scores - HR decisions have real consequences
2. If a REQUIRED skill is missing, cap score at 70 maximum
3. If 2+ REQUIRED skills missing, cap score at 50 maximum
4. Evidence-based only - don't assume skills not mentioned
5. Return ONLY the JSON object, no other text`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://rankhr.vercel.app',
        'X-Title': 'HireScore AI',
      },
      body: JSON.stringify({
        model: selectedModel,
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
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);

      // Try fallback model if primary fails
      if (selectedModel.includes('claude') || selectedModel.includes('anthropic')) {
        console.log('Trying fallback model: openai/gpt-5.2-20251211');
        const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://rankhr.vercel.app',
            'X-Title': 'HireScore AI',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5.2-20251211',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 2000,
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return processAIResponse(data, res);
        }
      }

      return res.status(500).json({
        error: 'AI service error',
        details: errorText.substring(0, 200),
      });
    }

    const data = await response.json();
    return processAIResponse(data, res);

  } catch (error) {
    console.error('Screening error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
}

function processAIResponse(data: any, res: VercelResponse) {
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('No content in AI response:', data);
    return res.status(500).json({ error: 'No response from AI' });
  }

  console.log('AI response length:', content.length);

  // Parse JSON from response
  try {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Try to find JSON object in the response
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    const result = JSON.parse(jsonStr);

    // Validate required fields
    if (typeof result.score !== 'number') {
      result.score = 50;
    }
    if (!['interview', 'maybe', 'pass'].includes(result.recommendation)) {
      result.recommendation = result.score >= 70 ? 'interview' : result.score >= 50 ? 'maybe' : 'pass';
    }

    return res.json({
      success: true,
      result: {
        score: Math.min(100, Math.max(0, result.score)),
        recommendation: result.recommendation,
        summary: result.summary || 'Analysis complete',
        matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
        missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
        concerns: Array.isArray(result.concerns) ? result.concerns : [],
        interviewQuestions: Array.isArray(result.interviewQuestions) ? result.interviewQuestions : [],
        experienceYears: typeof result.experienceYears === 'number' ? result.experienceYears : 0,
        // New military-grade fields
        skillMatchPercent: typeof result.skillMatchPercent === 'number' ? result.skillMatchPercent : null,
        educationMatch: typeof result.educationMatch === 'boolean' ? result.educationMatch : null,
      },
      usage: data.usage,
    });
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Content:', content.substring(0, 500));

    // Return with raw response for debugging
    return res.json({
      success: true,
      result: {
        score: 50,
        recommendation: 'maybe',
        summary: 'Could not fully parse AI analysis. Raw response included.',
        matchedSkills: [],
        missingSkills: [],
        concerns: ['AI response format error - manual review recommended'],
        interviewQuestions: [],
        experienceYears: 0,
        rawResponse: content.substring(0, 1000),
      },
      usage: data.usage,
    });
  }
}
