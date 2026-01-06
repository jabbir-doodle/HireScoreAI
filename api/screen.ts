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

    // Use a REAL OpenRouter model ID - claude-3.5-sonnet is the best for this
    const selectedModel = model || 'anthropic/claude-3-5-sonnet-20241022';

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

    const prompt = `You are an expert HR recruiter and talent acquisition specialist. Your task is to analyze how well a candidate matches a job description.

=== JOB DESCRIPTION ===
${jobDescription}

=== CANDIDATE CV/RESUME ===
${cvContent}

=== YOUR TASK ===
Analyze the candidate's fit for this position. Consider:
1. Technical skills match
2. Experience level and relevance
3. Education and certifications
4. Cultural indicators
5. Red flags or concerns

Provide your analysis as a JSON object with this EXACT structure:
{
  "score": <number from 0 to 100>,
  "recommendation": "<one of: interview, maybe, pass>",
  "summary": "<2-3 sentence executive summary of the candidate's fit>",
  "matchedSkills": ["<skill that matches job requirement>", ...],
  "missingSkills": ["<required skill candidate lacks>", ...],
  "concerns": ["<potential red flag or concern>", ...],
  "interviewQuestions": ["<suggested interview question>", "<another question>", "<third question>"],
  "experienceYears": <estimated total years of relevant experience as a number>
}

IMPORTANT:
- Score 80-100: Strong match, recommend interview
- Score 60-79: Moderate match, worth considering
- Score 40-59: Weak match, likely not suitable
- Score 0-39: Poor match, do not recommend
- Be objective and factual
- Return ONLY the JSON object, no other text`;

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
      if (selectedModel.includes('claude')) {
        console.log('Trying fallback model: openai/gpt-4o');
        const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://rankhr.vercel.app',
            'X-Title': 'HireScore AI',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o',
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
