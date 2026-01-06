import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { jobDescription, cvContent, model = 'anthropic/claude-sonnet-4.5' } = req.body;

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
        'HTTP-Referer': process.env.VERCEL_URL || 'https://hirescore.ai',
        'X-Title': 'HireScore AI',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return res.status(response.status).json({
        error: 'AI service temporarily unavailable'
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse JSON from response
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const result = JSON.parse(jsonStr);
      res.json({ success: true, result, usage: data.usage });
    } catch {
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
    res.status(500).json({ error: 'Internal server error' });
  }
}
