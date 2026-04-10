import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    const response = await fetch(`${backendUrl}/api/system/state?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.detail || 'Failed to load system state' }, { status: response.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 500 });
    }
    const payload = await req.json();
    const response = await fetch(`${backendUrl}/api/system/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.detail || 'Failed to save system state' }, { status: response.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
