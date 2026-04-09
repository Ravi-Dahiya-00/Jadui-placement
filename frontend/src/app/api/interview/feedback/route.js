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
    const sortedByScore = [...evaluations].sort((a, b) => Number(b.overall || 0) - Number(a.overall || 0));
    const strengths = sortedByScore
      .filter((e) => Number(e.overall || 0) >= 65)
      .slice(0, 3)
      .map((e) => {
        const tags = [];
        if (Number(e.clarity || 0) >= 70) tags.push('clarity');
        if (Number(e.correctness || 0) >= 70) tags.push('correctness');
        if (Number(e.relevance || 0) >= 70) tags.push('relevance');
        const tagText = tags.length ? ` (${tags.join(', ')})` : '';
        return `Strong signal on "${e.question}"${tagText}.`;
      });

    const improvements = evaluations
      .filter((e) => Number(e.overall || 0) < 70)
      .slice(0, 4)
      .map((e) => {
        const hint = Array.isArray(e.suggestions)
          ? e.suggestions.find((s) => String(s).toLowerCase().includes('model answer hint'))
          : '';
        return `${e.feedback || `Improve answer for: ${e.question}`}${hint ? ` ${hint}` : ''}`;
      });

    const mappedFeedback = {
      score: overall,
      summary: resultData.summary_feedback || 'Interview analysis completed.',
      strengths: strengths.length ? strengths : ['You completed the session; next focus is improving evidence depth and structure.'],
      improvements: improvements.length ? improvements : ['Improve technical depth: include architecture decisions, constraints, and measurable impact.'],
      answers: evaluations.map((e) => ({
        question: e.question,
        score: e.overall,
        feedback: e.feedback,
        suggestions: e.suggestions || [],
      })),
    };

    return NextResponse.json({ success: true, feedback: mappedFeedback }, { status: 200 });

  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}
