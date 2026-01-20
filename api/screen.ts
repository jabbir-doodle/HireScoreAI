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
    const selectedModel = model || 'z-ai/glm-4.7';

    if (!jobDescription || !cvContent) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and cvContent'
      });
    }

    // Check if CV content is actually meaningful (lowered threshold for scanned PDFs)
    if (cvContent.length < 50) {
      return res.status(400).json({
        error: 'CV content is too short. Please ensure the PDF contains text or paste the CV content manually.'
      });
    }

    console.log('Screening request:', {
      model: selectedModel,
      jdLength: jobDescription.length,
      cvLength: cvContent.length,
    });

    // 2026 Enterprise-Grade Prompt with Semantic Matching & Confidence Calibration
    const prompt = `<system>
You are HireScore AI v2.0 - Enterprise Talent Assessment Engine (January 2026).
Your assessments MUST be: EVIDENCE-BASED, SEMANTICALLY AWARE, and CONFIDENCE-CALIBRATED.
</system>

<skill_equivalencies>
TREAT THESE AS EXACT MATCHES (same skill, different names):
Frontend: React = React.js = ReactJS = "React 18/19" | Vue = Vue.js = VueJS | Angular = AngularJS = "Angular 17+"
Backend: Node.js = NodeJS = "Node" = Express.js | Python = Python3 = Py | Java = "Java 17+" | Go = Golang
Databases: PostgreSQL = Postgres = PSQL | MongoDB = Mongo | MySQL = MariaDB | Redis = "Redis Cache"
Cloud: AWS = "Amazon Web Services" = EC2/S3/Lambda mentions | GCP = "Google Cloud" | Azure = "Microsoft Azure"
DevOps: Docker = containerization | Kubernetes = K8s = "container orchestration" | CI/CD = "GitHub Actions" = Jenkins = "GitLab CI"
Languages: TypeScript = TS = "typed JavaScript" | JavaScript = JS = ES6+ | SQL = "database queries"
Methods: Agile = Scrum = Kanban = "Sprint-based" | TDD = "Test-Driven" | REST = RESTful = "REST API"

PARTIAL MATCHES (count at 70% weight - transferable skills):
React ↔ Vue ↔ Angular (modern frontend frameworks)
PostgreSQL ↔ MySQL ↔ SQLite (SQL databases)
MongoDB ↔ DynamoDB ↔ Cassandra (NoSQL databases)
AWS ↔ GCP ↔ Azure (cloud platforms)
Python ↔ Ruby ↔ PHP (scripting languages)
Java ↔ C# ↔ Kotlin (enterprise OOP languages)
</skill_equivalencies>

<seniority_detection>
JUNIOR (0-2 years): Entry-level, intern, associate, "I" suffix, learning focus
MID (2-5 years): Developer, engineer (no prefix), "II" suffix, independent contributor
SENIOR (5-8 years): Senior, Sr., lead (technical), "III" suffix, mentoring others
STAFF/PRINCIPAL (8+ years): Staff, principal, architect, distinguished, system design ownership
MANAGER: Team lead, engineering manager, people management, hiring responsibility
DIRECTOR+: Director, VP, Head of, C-level, strategy ownership, P&L responsibility

Evidence signals: "led team of X", "managed X engineers", "architected", "mentored X juniors"
</seniority_detection>

<scoring_rubric>
TOTAL = Technical(35) + Experience(25) + Education(15) + Progression(15) + Communication(10)

Technical Skills (0-35 pts):
• Each REQUIRED skill found with evidence: +7 pts (max 35)
• PARTIAL match (related skill): +5 pts
• NICE-TO-HAVE skills: +2 pts each
• GATING: 1 required missing → cap at 75 | 2+ missing → cap at 55 | 3+ missing → cap at 40

Experience (0-25 pts):
• Exceeds requirement by 2+ years: 25 pts
• Meets requirement exactly: 20 pts
• 1-2 years short: 15 pts
• 3+ years short: 8 pts
• Relevant industry bonus: +3 pts

Education (0-15 pts):
• Exact degree match: 15 pts
• Related degree: 12 pts
• Different field + relevant certs/bootcamp: 10 pts
• No degree, strong portfolio: 8 pts

Career Progression (0-15 pts):
• Clear upward trajectory with promotions: 15 pts
• Lateral moves with skill growth: 12 pts
• Stable but stagnant: 8 pts
• Job hopping (<1yr avg tenure): 5 pts

Communication (0-10 pts):
• Well-structured CV, quantified achievements ($, %, users): 10 pts
• Clear but generic descriptions: 7 pts
• Confusing, sparse, or poorly formatted: 4 pts
</scoring_rubric>

<interview_questions_guide>
Generate 5 CUSTOM questions based on THIS JD and CV. Use these prefixes:
- [PHONE] - Quick verification questions about CV claims
- [TECH] - Technical deep-dive on JD required skills
- [BEHAVIORAL] - Questions about concerns/red flags found
- [FINAL] - Questions about growth and missing skills

IMPORTANT: Questions MUST be specific to this candidate, NOT generic!
</interview_questions_guide>

<confidence_calibration>
Your confidence score MUST accurately reflect evidence quality:

0.90-1.00 (VERY HIGH): ALL required skills explicit with years/projects, clear verifiable timeline, quantified achievements, education stated
0.70-0.89 (HIGH): MOST skills stated, some inferred from context, timeline present with minor gaps, achievements mentioned
0.50-0.69 (MODERATE): SOME skills inferred, timeline unclear or gaps >1 year, generic descriptions
0.30-0.49 (LOW): MANY skills inferred not stated, sparse details, cannot verify key claims
0.00-0.29 (VERY LOW): INSUFFICIENT data, CV may be incomplete, major role mismatch
</confidence_calibration>

<output_example>
{
  "score": 78,
  "confidence": 0.85,
  "confidenceReason": "Clear React/TS evidence, 1 unexplained gap",
  "recommendation": "interview",
  "summary": "Strong frontend match with 6yr React experience. Top strength: led team shipping 50K-user app. Gap: no AWS experience.",
  "scoreBreakdown": {
    "technicalSkills": 28,
    "experience": 22,
    "education": 12,
    "careerProgression": 10,
    "communication": 6
  },
  "matchedSkills": [
    {"skill": "React", "evidence": "React 18 dashboard, 50K users", "matchType": "exact"},
    {"skill": "TypeScript", "evidence": "5 years TypeScript strict mode", "matchType": "exact"},
    {"skill": "Node.js", "evidence": "Express.js APIs", "matchType": "synonym"}
  ],
  "partialMatches": [
    {"skill": "AWS", "candidateHas": "GCP", "matchPercent": 70}
  ],
  "missingSkills": ["GraphQL", "Kubernetes"],
  "seniorityAssessment": {
    "detected": "senior",
    "required": "senior",
    "match": true,
    "evidence": "Led team of 5, 6 years experience"
  },
  "strengths": ["Production React at scale", "Team leadership", "Performance optimization"],
  "concerns": ["Employment gap 2021-2023", "No cloud-native experience"],
  "interviewQuestions": [
    "[PHONE] Verify: <question about specific CV claim>",
    "[TECH] Skill check: <question about JD required skill>",
    "[TECH] Deep dive: <question about CV project>",
    "[BEHAVIORAL] Concern: <question about red flag found>",
    "[FINAL] Growth: <question about missing skill learning>"
  ],
  "experienceYears": 6,
  "relevantExperienceYears": 5,
  "skillMatchPercent": 75,
  "educationMatch": true
}
</output_example>

═══════════════════════════════════════════════════════════════
JOB REQUIREMENTS:
${jobDescription}
═══════════════════════════════════════════════════════════════
CANDIDATE CV/RESUME:
${cvContent}
═══════════════════════════════════════════════════════════════

ANALYZE NOW. Return ONLY valid JSON matching the output_example structure. No markdown, no explanation.`;

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
        console.log('Trying fallback model: openai/gpt-5.2');
        const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://rankhr.vercel.app',
            'X-Title': 'HireScore AI',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5.2',
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

// Generic number parser - handles number or string, returns null if invalid
function parseNumberField(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

// Robust experience years parsing - handles number, string, or missing values
function parseExperienceYears(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === 'string') {
    // Handle "10 years", "10+", "10-15", or just "10"
    const match = value.match(/(\d+)/);
    if (match) {
      return Math.max(0, parseInt(match[1], 10));
    }
  }
  return 0;
}

function processAIResponse(data: any, res: VercelResponse) {
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('No content in AI response:', data);
    return res.status(500).json({ error: 'No response from AI' });
  }

  console.log('AI response length:', content.length);

  // Parse JSON from response with robust error handling
  try {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present (various formats)
    const codeBlockMatch = content.match(/```(?:json|JSON)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // Remove any leading text before the JSON object
    const jsonStartIndex = jsonStr.indexOf('{');
    if (jsonStartIndex > 0) {
      jsonStr = jsonStr.substring(jsonStartIndex);
    }

    // Remove any trailing text after the JSON object
    const jsonEndIndex = jsonStr.lastIndexOf('}');
    if (jsonEndIndex > 0 && jsonEndIndex < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, jsonEndIndex + 1);
    }

    // Clean up common JSON issues (simple and reliable)
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n\r\t
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n');   // Normalize line endings

    const result = JSON.parse(jsonStr);

    // Validate required fields
    if (typeof result.score !== 'number') {
      result.score = 50;
    }
    if (!['interview', 'maybe', 'pass'].includes(result.recommendation)) {
      result.recommendation = result.score >= 70 ? 'interview' : result.score >= 50 ? 'maybe' : 'pass';
    }

    // Process matchedSkills - handle both old format (string[]) and new format (object[])
    let matchedSkills: string[] = [];
    if (Array.isArray(result.matchedSkills)) {
      matchedSkills = result.matchedSkills.map((s: any) =>
        typeof s === 'string' ? s : (s.skill || s.name || String(s))
      );
    }

    // Process interviewQuestions - simple string array
    let interviewQuestions: string[] = [];
    if (Array.isArray(result.interviewQuestions)) {
      interviewQuestions = result.interviewQuestions.map((q: any) =>
        typeof q === 'string' ? q : (q.question || String(q))
      );
    }

    // Extract strengths from new format or matchedSkills
    const strengths = Array.isArray(result.strengths) ? result.strengths : matchedSkills.slice(0, 5);

    // Extract partial matches if present
    const partialMatches = Array.isArray(result.partialMatches)
      ? result.partialMatches.map((p: any) => `${p.skill} (have: ${p.candidateHas})`)
      : [];

    // ENFORCE GATING RULES - Don't trust AI to apply caps correctly
    const missingSkills = Array.isArray(result.missingSkills) ? result.missingSkills : [];
    const missingCount = missingSkills.length;
    let rawScore = typeof result.score === 'number' ? result.score : 50;
    let finalScore = rawScore;
    let gatingApplied = false;

    // Apply gating caps based on missing required skills
    if (missingCount >= 3 && rawScore > 40) {
      finalScore = 40;
      gatingApplied = true;
    } else if (missingCount >= 2 && rawScore > 55) {
      finalScore = 55;
      gatingApplied = true;
    } else if (missingCount >= 1 && rawScore > 75) {
      finalScore = 75;
      gatingApplied = true;
    }

    // Adjust recommendation based on gated score
    let recommendation = result.recommendation;
    if (!['interview', 'maybe', 'pass'].includes(recommendation)) {
      recommendation = finalScore >= 70 ? 'interview' : finalScore >= 50 ? 'maybe' : 'pass';
    } else if (gatingApplied) {
      // Re-evaluate recommendation if gating changed the score significantly
      recommendation = finalScore >= 70 ? 'interview' : finalScore >= 50 ? 'maybe' : 'pass';
    }

    console.log(`[Gating] Raw: ${rawScore}, Missing: ${missingCount}, Final: ${finalScore}, Applied: ${gatingApplied}`);

    return res.json({
      success: true,
      result: {
        score: Math.min(100, Math.max(0, finalScore)),
        recommendation,
        summary: result.summary || 'Analysis complete',
        matchedSkills,
        missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
        concerns: Array.isArray(result.concerns) ? result.concerns : [],
        interviewQuestions,
        experienceYears: parseExperienceYears(result.experienceYears),
        // 2026 Enterprise fields
        confidence: parseNumberField(result.confidence),
        confidenceReason: result.confidenceReason || null,
        scoreBreakdown: result.scoreBreakdown || null,
        partialMatches,
        strengths,
        seniorityAssessment: result.seniorityAssessment || null,
        relevantExperienceYears: result.relevantExperienceYears ? parseExperienceYears(result.relevantExperienceYears) : null,
        skillMatchPercent: parseNumberField(result.skillMatchPercent),
        educationMatch: typeof result.educationMatch === 'boolean' ? result.educationMatch :
                        result.educationMatch === 'partial' ? 'partial' : null,
      },
      usage: data.usage,
    });
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Content:', content.substring(0, 500));

    // Enterprise: Try to extract partial data before failing
    try {
      // Attempt to extract fields using regex patterns
      const scoreMatch = content.match(/"score"\s*:\s*(\d+)/);
      const recMatch = content.match(/"recommendation"\s*:\s*"(interview|maybe|pass)"/i);
      const summaryMatch = content.match(/"summary"\s*:\s*"([^"]{10,500})"/);

      // Extract arrays using regex
      const extractArray = (fieldName: string): string[] => {
        const arrayMatch = content.match(new RegExp(`"${fieldName}"\\s*:\\s*\\[([^\\]]{0,2000})\\]`));
        if (arrayMatch) {
          const items = arrayMatch[1].match(/"([^"]+)"/g);
          return items ? items.map(s => s.replace(/"/g, '')) : [];
        }
        return [];
      };

      const matchedSkills = extractArray('matchedSkills');
      const missingSkills = extractArray('missingSkills');
      const strengths = extractArray('strengths');
      const concerns = extractArray('concerns');
      const interviewQuestions = extractArray('interviewQuestions');

      // Extract experience years
      const expMatch = content.match(/"experienceYears"\s*:\s*(\d+)/);
      const experienceYears = expMatch ? parseInt(expMatch[1], 10) : 0;

      if (scoreMatch) {
        const fallbackScore = parseInt(scoreMatch[1], 10);
        const fallbackRec = recMatch?.[1]?.toLowerCase() as 'interview' | 'maybe' | 'pass' ||
          (fallbackScore >= 70 ? 'interview' : fallbackScore >= 50 ? 'maybe' : 'pass');

        console.log(`[Recovery] Extracted: score=${fallbackScore}, skills=${matchedSkills.length}, strengths=${strengths.length}`);

        return res.json({
          success: true,
          result: {
            score: Math.min(100, Math.max(0, fallbackScore)),
            recommendation: fallbackRec,
            summary: summaryMatch?.[1] || 'Analysis completed with partial data extraction.',
            matchedSkills: matchedSkills.length > 0 ? matchedSkills : [],
            missingSkills: missingSkills.length > 0 ? missingSkills : [],
            concerns: concerns.length > 0 ? concerns : [],
            strengths: strengths.length > 0 ? strengths : (matchedSkills.length > 0 ? matchedSkills.slice(0, 3) : []),
            interviewQuestions: interviewQuestions.length > 0 ? interviewQuestions : [],
            experienceYears,
            confidence: 0.6,
            confidenceReason: 'Partial data extraction - some formatting issues in AI response',
          },
          usage: data.usage,
          warning: 'Partial data extracted - some fields may be incomplete',
        });
      }
    } catch (recoveryError) {
      console.error('Recovery also failed:', recoveryError);
    }

    // Complete failure - return error
    return res.status(422).json({
      success: false,
      error: 'AI response parsing failed',
      errorCode: 'PARSE_ERROR',
      message: 'The AI returned an invalid response format. Try a different model.',
    });
  }
}
