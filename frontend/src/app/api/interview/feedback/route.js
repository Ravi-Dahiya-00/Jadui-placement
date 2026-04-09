import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

// We map the Zod/JSON schema format defined in PulseAI
const feedbackSchema = {
  type: 'object',
  properties: {
    totalScore: { type: 'number', description: 'Score out of 100 based on candidate performance' },
    categoryScores: {
      type: 'object',
      properties: {
        technical: { type: 'number' },
        behavioral: { type: 'number' },
        communication: { type: 'number' }
      },
      required: ['technical', 'behavioral', 'communication']
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Top 3 strengths shown in the interview'
    },
    areasForImprovement: {
      type: 'array',
      items: { type: 'string' },
      description: 'Areas where the candidate struggled'
    },
    finalAssessment: { type: 'string', description: 'A 2-3 sentence final summary of the performance' }
  },
  required: ['totalScore', 'categoryScores', 'strengths', 'areasForImprovement', 'finalAssessment']
};

export const maxDuration = 120; // Allow sufficient time for LLM parsing

export async function POST(req) {
  try {
    const { interviewId, userId, transcript } = await req.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'Transcript is empty' }, { status: 400 });
    }

    const formattedTranscript = transcript
      .map(s => `- ${s.role}: ${s.content}\n`)
      .join('');

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: feedbackSchema,
      prompt: `You are an AI interviewer analyzing a mock voice interview. Evaluate their answers rigorously.
      Transcript: ${formattedTranscript}`,
      system: 'You are a professional HR recruiter and technical interviewer analyzing a mock interview transcript.',
    });

    // In a full production Supabase implementation, we would insert `object` into `feedback` table here.
    // For now we map it exactly to the frontend Dashboard's expected format.

    const mappedFeedback = {
      score: object.totalScore,
      summary: object.finalAssessment,
      strengths: object.strengths,
      improvements: object.areasForImprovement,
      answers: transcript.filter(t => t.role === 'user').map(t => ({
          question: 'Candidate Spoke:',
          score: Math.round(object.totalScore * (0.8 + Math.random() * 0.4)), // mock score per answer
          feedback: t.content
      }))
    };

    return NextResponse.json({ success: true, feedback: mappedFeedback }, { status: 200 });

  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}
