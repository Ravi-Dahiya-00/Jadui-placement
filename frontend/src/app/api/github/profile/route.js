import { NextResponse } from 'next/server'

/**
 * Proxies to FastAPI GET /github/profile/{username}
 * GitHub token stays on the backend (GITHUB_TOKEN on Render).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')?.trim()
    const insights = searchParams.get('insights') === '1' || searchParams.get('insights') === 'true'

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 500 })
    }

    const qs = new URLSearchParams()
    if (insights) qs.set('insights', 'true')

    const url = `${backendUrl.replace(/\/$/, '')}/github/profile/${encodeURIComponent(username)}?${qs}`
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const detail = data?.detail
      const msg = Array.isArray(detail) ? detail.map((d) => d?.msg || '').join(' ') : detail || res.statusText
      return NextResponse.json({ error: msg || 'GitHub profile fetch failed' }, { status: res.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
