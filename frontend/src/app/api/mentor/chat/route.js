import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

function backendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''
}

async function fetchSystemState(userId) {
  const base = backendUrl()
  if (!base || !userId) return null
  try {
    const res = await fetch(`${base}/system/state?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.state ?? data
  } catch {
    return null
  }
}

/**
 * Client React state can be empty on first paint; merge Supabase-backed `user_system_state`
 * so scores and tasks are not all zeros.
 */
function mergeNum(clientVal, serverVal) {
  const c = Number(clientVal)
  const s = Number(serverVal)
  if (Number.isFinite(s) && s > 0 && (!Number.isFinite(c) || c === 0)) return s
  if (Number.isFinite(c) && c > 0) return c
  return Number.isFinite(s) ? s : Number.isFinite(c) ? c : 0
}

function mergeDashboardContext(clientContext, serverState) {
  if (!serverState) return clientContext
  const cc = serverState.chat_context || {}
  const clientCc = clientContext.chatContext || {}
  const sr = cc.avgResumeScore ?? cc.avg_resume_score
  const si = cc.avgInterviewScore ?? cc.avg_interview_score
  const mergedCc = {
    ...clientCc,
    avgResumeScore: mergeNum(clientCc.avgResumeScore, sr),
    avgInterviewScore: mergeNum(clientCc.avgInterviewScore, si),
    latestRoleTarget:
      clientCc.latestRoleTarget ||
      cc.latestRoleTarget ||
      cc.latest_role_target ||
      '',
    topSkillGaps:
      clientContext.skillGaps?.length > 0
        ? clientContext.skillGaps
        : cc.topSkillGaps || cc.top_skill_gaps || [],
  }
  return {
    ...clientContext,
    skillGaps:
      clientContext.skillGaps?.length > 0 ? clientContext.skillGaps : serverState.skill_gaps || [],
    tasks: clientContext.tasks?.length > 0 ? clientContext.tasks : serverState.tasks || [],
    roadmap: clientContext.roadmap?.length > 0 ? clientContext.roadmap : serverState.roadmap || [],
    notifications:
      clientContext.notifications?.length > 0
        ? clientContext.notifications
        : (serverState.notifications || []).slice(0, 8),
    chatContext: mergedCc,
  }
}

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
  const gaps = context?.skillGaps?.length
    ? context.skillGaps
    : cc.topSkillGaps || []

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
- Summary line: ${String(s.summary || (typeof s.detailed_review === 'string' ? s.detailed_review.slice(0, 400) : '') || s.overall_feedback || '').slice(0, 600)}
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
- **Answer the user's latest question directly first** — different questions must get different structure and content. Never repeat a prior answer verbatim.
- Reference concrete numbers (scores, counts, gap names) when relevant.
- Tie recommendations to their tasks and roadmap when those exist.
- If data is thin, say what is missing and suggest one measurable next step.
- Prefer short sections with **bold** headings. Be concise unless they ask for a long plan.
- Do not claim you "stored" data or "updated the database".`
}

/**
 * When Gemini is unavailable, still vary copy by intent and include the actual question.
 */
function fallbackReply(message, context, resumeRows, interviewRows) {
  const q = (message || '').toLowerCase()
  const cc = context?.chatContext || {}
  const tasks = context?.tasks || []
  const roadmap = context?.roadmap || []
  const gaps = context?.skillGaps?.length ? context.skillGaps : cc.topSkillGaps || []
  const gapStr = gaps.slice(0, 5).join(', ') || 'problem-solving, communication, system fundamentals'
  const avgR = Number(cc.avgResumeScore) || 0
  const avgI = Number(cc.avgInterviewScore) || 0
  const latestIv = interviewRows?.[0]
  const latestRe = resumeRows?.[0]
  const pending = tasks.filter((t) => !t.completed).slice(0, 3)

  const dataLine = `**Your data:** resume avg **${avgR}**/100 · interview avg **${avgI}**/100 · gaps: ${gapStr}. `

  if (/7[\s-]*day|seven day|week plan|roadmap/i.test(q)) {
    const days = roadmap.length ? roadmap : []
    const gList = gaps.length ? gaps : gapStr.split(',').map((s) => s.trim()).filter(Boolean)
    const pickGap = (n) => gList[n % Math.max(gList.length, 1)] || 'your priority skill'
    const lines = days.length
      ? days.slice(0, 7).map((d, i) => `**Day ${i + 1} (${d.day}):** ${(d.tasks || []).slice(0, 2).join(' · ') || 'Focus on top gap + one measurable deliverable.'}`)
      : [1, 2, 3, 4, 5, 6, 7].map(
          (n) =>
            `**Day ${n}:** 60m on **${pickGap(n - 1)}** · 30m review · 1 short write-up of what changed`
        )
    return (
      `You asked: "${message.slice(0, 200)}"\n\n` +
      dataLine +
      (latestRe ? `Latest resume run: **${latestRe.score}**/100 (${latestRe.role_target || 'role'}). ` : '') +
      (latestIv ? `Latest mock interview: **${latestIv.overall_score}**/100 (${latestIv.role || 'role'}). ` : '') +
      `\n\n**7-day roadmap (aligned to your profile)**\n\n${lines.join('\n\n')}\n\n` +
      `_Tip: add **GEMINI_API_KEY** on Render (backend) or Vercel so the mentor uses full Gemini instead of this template._`
    )
  }

  if (/this week|focus|priorit/i.test(q)) {
    const next = pending.length
      ? pending.map((t) => `• **${t.title}** (${t.due || 'soon'})`).join('\n')
      : `• Deep work on **${gaps[0] || 'your weakest area'}** (90m)\n• One timed mock answer with metrics\n• One resume bullet with numbers`
    return (
      `You asked: "${message.slice(0, 200)}"\n\n` +
      dataLine +
      `\n**This week — do these first:**\n${next}\n\n` +
      `_Tip: set **GEMINI_API_KEY** on Render or Vercel for conversational AI coaching._`
    )
  }

  if (/interview|score|mock/i.test(q)) {
    return (
      `You asked: "${message.slice(0, 200)}"\n\n` +
      dataLine +
      (latestIv
        ? `Latest session: **${latestIv.overall_score}**/100, ${latestIv.answered_count || 0}/${latestIv.total_questions || '?'} answered (${latestIv.role}). `
        : 'No mock interview history in the database yet — schedule one in the dashboard. ') +
      `\n\n**To raise interview scores:** use STAR/PAR, name trade-offs, add one metric per story, and do one full mock every 2–3 days.\n\n` +
      `_Tip: add **GEMINI_API_KEY** on Render or Vercel for deeper feedback._`
    )
  }

  if (/improve|skill|gap/i.test(q)) {
    const top = gaps[0] || 'your weakest listed skill'
    return (
      `You asked: "${message.slice(0, 200)}"\n\n` +
      dataLine +
      `\n**Improving ${top}:**\n• One focused block daily (45–90m)\n• One small project or LeetCode/design prompt with a written retrospective\n• Teach it back in one paragraph (Feynman-style)\n\n` +
      `_Tip: add **GEMINI_API_KEY** on Render or Vercel for tailored coaching._`
    )
  }

  return (
    `You asked: "${message.slice(0, 200)}"\n\n` +
    dataLine +
    (latestRe ? `Latest resume: **${latestRe.score}**/100 (${latestRe.role_target || 'role'}). ` : '') +
    (latestIv ? `Latest interview: **${latestIv.overall_score}**/100. ` : '') +
    `\n\n**Suggestions:** pick one gap from above, tie it to a task or roadmap day, and measure one outcome (score, time, or artifact) by end of week.\n\n` +
    `_Tip: add **GEMINI_API_KEY** on Render (backend) or Vercel for natural Gemini answers._`
  )
}

async function callBackendMentor(baseUrl, systemPrompt, message, historyPrior) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/mentor/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      system_prompt: systemPrompt,
      message,
      history: historyPrior.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 12000),
      })),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data?.detail
    const msg = Array.isArray(detail)
      ? detail.map((d) => d?.msg || d).join(', ')
      : typeof detail === 'string'
        ? detail
        : res.statusText
    throw new Error(msg || 'Backend mentor failed')
  }
  return data
}

export async function POST(request) {
  try {
    const body = await request.json()
    const message = String(body?.message || '').trim()
    const history = Array.isArray(body?.history) ? body.history : []
    let context = body?.context || {}
    const userId = context?.userId || 'demo-user'

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const serverState = await fetchSystemState(userId)
    context = mergeDashboardContext(context, serverState)

    const { resumeRows, interviewRows } = await fetchDashboardSnapshot(userId)

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

    const base = backendUrl()
    const vercelGemini = process.env.GEMINI_API_KEY

    // 1) Optional: Gemini on Vercel (env var on the frontend deployment)
    if (vercelGemini) {
      const modelId = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      const google = createGoogleGenerativeAI({ apiKey: vercelGemini })
      const { text } = await generateText({
        model: google(modelId),
        system,
        messages: [
          ...prior,
          {
            role: 'user',
            content:
              `Latest question (answer this specifically; do not repeat generic advice):\n"""${message.slice(0, 8000)}"""`,
          },
        ],
        temperature: 0.88,
        maxOutputTokens: 2048,
      })
      return NextResponse.json({
        message: text || fallbackReply(message, context, resumeRows, interviewRows),
        usedAI: true,
        source: 'vercel',
      })
    }

    // 2) Gemini on Render / FastAPI (same key you already use for interview)
    if (base) {
      try {
        const data = await callBackendMentor(base, system, message, prior)
        return NextResponse.json({
          message: data.message || fallbackReply(message, context, resumeRows, interviewRows),
          usedAI: true,
          source: data.source || 'backend',
        })
      } catch (be) {
        console.error('backend mentor error:', be)
        return NextResponse.json({
          message: fallbackReply(message, context, resumeRows, interviewRows),
          usedAI: false,
          warning: `Backend mentor unavailable: ${be instanceof Error ? be.message : String(be)}`,
        })
      }
    }

    return NextResponse.json({
      message: fallbackReply(message, context, resumeRows, interviewRows),
      usedAI: false,
      warning: 'No GEMINI_API_KEY on Vercel and NEXT_PUBLIC_BACKEND_URL not set',
    })
  } catch (error) {
    console.error('mentor chat error:', error)
    const msg = error instanceof Error ? error.message : 'Mentor chat failed'
    return NextResponse.json(
      {
        message:
          '**Something went wrong** calling the AI. Check that `GEMINI_API_KEY` is valid and `GEMINI_MODEL` matches your account. ' +
          `Details: ${msg}`,
        usedAI: false,
        error: msg,
      },
      { status: 503 }
    )
  }
}
