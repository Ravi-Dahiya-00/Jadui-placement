import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 500 });
    }

    const { interviewId, transcript } = await req.json();
    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId is required' }, { status: 400 });
    }

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'Transcript is empty' }, { status: 400 });
    }

    const userAnswers = transcript.filter((t) => t.role === 'user' && t.content?.trim());
    for (let i = 0; i < userAnswers.length; i += 1) {
      const res = await fetch(`${backendUrl}/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: interviewId,
          question_index: i,
          answer: userAnswers[i].content,
        }),
      });
      if (!res.ok) {
        break;
      }
    }

    const resultRes = await fetch(`${backendUrl}/interview/result?session_id=${encodeURIComponent(interviewId)}`, {
      method: 'GET',
    });
    const resultData = await resultRes.json();
    if (!resultRes.ok) {
      return NextResponse.json({ error: resultData?.detail || 'Failed to fetch interview result' }, { status: resultRes.status });
    }

    const evaluations = resultData.evaluations || [];
    const overall = resultData?.scores?.overall || 0;
    const strengths = evaluations
      .filter((e) => Number(e.overall || 0) >= 70)
      .slice(0, 3)
      .map((e) => `Strong response on: ${e.question}`);
    const improvements = evaluations
      .filter((e) => Number(e.overall || 0) < 70)
      .slice(0, 3)
      .map((e) => e.feedback || `Improve answer for: ${e.question}`);

    const mappedFeedback = {
      score: overall,
      summary: resultData.summary_feedback || 'Interview analysis completed.',
      strengths: strengths.length ? strengths : ['Consistent participation in the interview session.'],
      improvements: improvements.length ? improvements : ['Provide more detailed and structured responses.'],
      answers: evaluations.map((e) => ({
        question: e.question,
        score: e.overall,
        feedback: e.feedback,
      })),
    };

    return NextResponse.json({ success: true, feedback: mappedFeedback }, { status: 200 });

  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}
