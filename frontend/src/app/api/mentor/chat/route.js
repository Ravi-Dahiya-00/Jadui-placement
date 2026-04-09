import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

function backendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''
}

/**
 * Pull fresh resume + interview rows from the FastAPI backend so the mentor
 * reasons over real history, not only the client snapshot.
 */
async function fetchDashboardSnapshot(userId) {
  const base = backendUrl()
  if (!base) return { resumeRows: [], interviewRows: [], error: 'no_backend' }

  try {
    const [resumeRes, interviewRes] = await Promise.all([
      fetch(`${base}/resume/history?limit=12`, { method: 'GET', cache: 'no-store' }),
      fetch(`${base}/interview/history?limit=12`, { method: 'GET', cache: 'no-store' }),
    ])
    const resumePayload = resumeRes.ok ? await resumeRes.json() : {}
    const interviewPayload = interviewRes.ok ? await interviewRes.json() : {}
    return {
      resumeRows: resumePayload.history || [],
      interviewRows: interviewPayload.history || [],
      error: null,
    }
  } catch (e) {
    return { resumeRows: [], interviewRows: [], error: String(e?.message || e) }
  }
}

function compactResumeRows(rows) {
  return (rows || []).slice(0, 8).map((r) => ({
    score: r.score,
    role_target: r.role_target,
    created_at: r.created_at,
    skill_gap: (r.skill_gap || []).slice(0, 5),
  }))
}

function compactInterviewRows(rows) {
  return (rows || []).slice(0, 8).map((r) => ({
    role: r.role,
    overall_score: r.overall_score,
    answered_count: r.answered_count,
    total_questions: r.total_questions,
    created_at: r.created_at,
  }))
}

function buildSystemPrompt({ context, resumeRows, interviewRows, resumeSnapshot }) {
  const cc = context?.chatContext || {}
  const progress = context?.progress || {}
  const tasks = (context?.tasks || []).slice(0, 24)
  const roadmap = (context?.roadmap || []).slice(0, 7)
  const gaps = context?.skillGaps || cc.topSkillGaps || []

  const taskLines = tasks
    .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.category || 'Task'}, ${t.due || 'soon'})`)
    .join('\n')

  const roadmapLines = roadmap
    .map((d) => `- ${d.day} (${d.status}): ${(d.tasks || []).slice(0, 2).join('; ')}`)
    .join('\n')

  const resumeFromDb = JSON.stringify(compactResumeRows(resumeRows), null, 0)
  const interviewsFromDb = JSON.stringify(compactInterviewRows(interviewRows), null, 0)

  let resumeExtra = ''
  if (resumeSnapshot && typeof resumeSnapshot === 'object') {
    const s = resumeSnapshot
    resumeExtra = `
Current resume analysis snapshot (latest session in browser):
- Overall score: ${s.score ?? s.overall_score ?? 'n/a'}
- Target role: ${s.role_target || s.targetRole || cc.latestRoleTarget || 'n/a'}
- Summary line: ${String(s.summary || s.detailed_review?.slice?.(0, 400) || s.overall_feedback || '').slice(0, 600)}
`
  }

  return `You are an expert career coach and placement mentor for software/engineering roles (India + global tech hiring).

You MUST personalize every answer using the user's dashboard data below. Do not give generic advice when specific gaps, scores, or tasks exist.

## User metrics (aggregated)
- Avg resume score (from history): ${cc.avgResumeScore ?? 'n/a'} / 100
- Avg mock interview score: ${cc.avgInterviewScore ?? progress.interviewScore ?? 'n/a'} / 100
- Readiness blend (UI): ${progress.readinessScore ?? 'n/a'}
- Task completion %: ${progress.taskCompletion ?? 'n/a'}
- Streak: ${progress.streak ?? 'n/a'}
- Target role hint: ${cc.latestRoleTarget || cc.targetRole || 'not set'}
- Top skill gaps (prioritize these): ${gaps.length ? gaps.join(', ') : 'infer from data'}

## Task list (real)
${taskLines || '(no tasks loaded)'}

## Weekly roadmap snapshot
${roadmapLines || '(no roadmap)'}

## Resume history (server, recent)
${resumeFromDb}

## Mock interview history (server, recent)
${interviewsFromDb}
${resumeExtra}

## Response rules
- Reference concrete numbers (scores, counts, gap names) when relevant.
- Tie recommendations to their tasks and roadmap (e.g. "finish the System Design task due Tomorrow before adding new DSA volume").
- If data is thin, say what is missing and suggest one measurable next step.
- Prefer short sections: **Key insight**, **This week**, **Next actions** (bullet points).
- Be encouraging but honest; no filler. Max ~450 words unless the user asks for a long plan.
- Do not claim you "stored" data or "updated the database".`
}

function fallbackReply(message, context, resumeRows, interviewRows) {
  const cc = context?.chatContext || {}
  const gaps = (context?.skillGaps || []).slice(0, 5).join(', ') || 'core CS, system design, communication'
  const avgR = cc.avgResumeScore ?? 0
  const avgI = cc.avgInterviewScore ?? 0
  const latestIv = interviewRows?.[0]
  const latestRe = resumeRows?.[0]
  return (
    `**Key insight** — Your dashboard shows resume avg **${avgR}**/100 and interview avg **${avgI}**/100. ` +
    (latestIv
      ? `Latest mock: **${latestIv.overall_score ?? '?'}**/100 (${latestIv.role || 'role'}). `
      : '') +
    (latestRe ? `Latest resume run: **${latestRe.score ?? '?'}/100** (${latestRe.role_target || 'target role'}). ` : '') +
    `**Priority gaps:** ${gaps}. ` +
    `**Next actions:** (1) One deep practice block on the top gap, (2) one timed mock focusing on structure and metrics, (3) tighten one resume bullet with a measurable outcome. ` +
    `(AI mentor offline: add **GEMINI_API_KEY** to enable full Gemini analysis.)`
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const message = String(body?.message || '').trim()
    const history = Array.isArray(body?.history) ? body.history : []
    const context = body?.context || {}
    const userId = context?.userId || 'demo-user'

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const { resumeRows, interviewRows } = await fetchDashboardSnapshot(userId)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        message: fallbackReply(message, context, resumeRows, interviewRows),
        usedAI: false,
        warning: 'GEMINI_API_KEY not set',
      })
    }

    const modelId = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

    const google = createGoogleGenerativeAI({ apiKey })

    const system = buildSystemPrompt({
      context,
      resumeRows,
      interviewRows,
      resumeSnapshot: context?.resumeSnapshot,
    })

    const prior = history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-16)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 12000),
      }))

    const { text } = await generateText({
      model: google(modelId),
      system,
      messages: [...prior, { role: 'user', content: message.slice(0, 8000) }],
      temperature: 0.65,
      maxOutputTokens: 2048,
    })

    return NextResponse.json({
      message: text || fallbackReply(message, context, resumeRows, interviewRows),
      usedAI: true,
    })
  } catch (error) {
    console.error('mentor chat error:', error)
    const msg = error instanceof Error ? error.message : 'Mentor chat failed'
    return NextResponse.json(
      {
        message:
          '**Something went wrong** calling the AI. Check that `GEMINI_API_KEY` is set for this deployment, then try again. ' +
          `(${msg})`,
        usedAI: false,
        error: msg,
      },
      { status: 503 }
    )
  }
}
