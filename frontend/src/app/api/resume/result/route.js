import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const resultId = searchParams.get('resultId');
    if (!resultId) {
      return NextResponse.json({ error: 'resultId is required' }, { status: 400 });
    }

    const response = await fetch(`${backendUrl}/resume/result?result_id=${encodeURIComponent(resultId)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.detail || 'Failed to fetch resume result' }, { status: response.status });
    }

    const result = data?.result || {};
    return NextResponse.json(
      {
        resultId: result.result_id,
        fileId: result.file_id,
        score: result.score || 0,
        skills: result.skills || [],
        weaknesses: result.weaknesses || [],
        recommendations: result.recommended_roles || [],
        domain: result.experience_level || 'unknown',
        sectionReviews: result.section_reviews || [],
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
