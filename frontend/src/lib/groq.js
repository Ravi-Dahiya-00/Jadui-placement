import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert technical recruiter with 15+ years of experience. 
Your task is to analyze a candidate's resume against a job description and provide a structured evaluation.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no extra text.

The JSON must follow this exact structure:
{
  "score": <integer 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "recommendation": "Strong Fit" | "Moderate Fit" | "Not Fit",
  "summary": "<2 concise sentences from a recruiter perspective>"
}

Scoring guidelines:
- 75–100: Strong Fit (candidate meets most/all key requirements)
- 50–74: Moderate Fit (candidate meets some requirements, has potential)
- 0–49: Not Fit (candidate lacks critical requirements)

Be specific in strengths and gaps — reference actual skills, tools, or experiences from the resume.`;

export async function analyzeResume(jdText, resumeText) {
  const userPrompt = `Job Description:
---
${jdText}
---

Candidate Resume:
---
${resumeText}
---

Analyze this candidate's fit for the role and return ONLY the JSON response.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq API');
  }

  const parsed = JSON.parse(content);

  // Validate and normalize recommendation
  const score = Math.min(100, Math.max(0, Math.round(parsed.score)));
  let recommendation;
  if (score >= 75) recommendation = 'Strong Fit';
  else if (score >= 50) recommendation = 'Moderate Fit';
  else recommendation = 'Not Fit';

  return {
    score,
    strengths: (parsed.strengths || []).slice(0, 3),
    gaps: (parsed.gaps || []).slice(0, 3),
    recommendation,
    summary: parsed.summary || '',
  };
}
