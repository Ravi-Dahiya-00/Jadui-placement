import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const githubUsername = searchParams.get('github_username');

    if (!githubUsername) {
      return NextResponse.json({ error: 'github_username is required' }, { status: 400 });
    }

    const response = await fetch(`${backendUrl}/api/system/suggestions?github_username=${encodeURIComponent(githubUsername)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.detail || 'Failed to load suggestions' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
