import { NextResponse } from 'next/server';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CATEGORY_BY_GAP = {
  system: 'Design',
  design: 'Design',
  dsa: 'DSA',
  algorithm: 'DSA',
  interview: 'Interview',
  communication: 'Interview',
  sql: 'Core',
  database: 'Core',
  project: 'Project',
};

function categoryForGap(gap) {
  const text = String(gap || '').toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_BY_GAP)) {
    if (text.includes(keyword)) return category;
  }
  return 'Core';
}

function buildRoadmap(gaps) {
  const normalized = gaps.length ? gaps : ['Problem-solving', 'Communication', 'System design basics'];
  return DAY_LABELS.map((day, idx) => {
    const primary = normalized[idx % normalized.length];
    const secondary = normalized[(idx + 1) % normalized.length];
    return {
      day,
      date: `Day ${idx + 1}`,
      status: idx < 2 ? 'done' : idx === 2 ? 'active' : 'upcoming',
      tasks: [
        `Practice ${primary} for 60 minutes`,
        `Complete 2 focused questions on ${secondary}`,
        'Write one measurable learning summary',
      ],
    };
  });
}

function buildTasks(roadmap) {
  const dueMap = ['Today', 'Today', 'Tomorrow', 'Tomorrow', 'This Week', 'This Week', 'This Week'];
  const tasks = [];
  roadmap.forEach((dayItem, i) => {
    dayItem.tasks.forEach((task, j) => {
      tasks.push({
        id: `${dayItem.day.toLowerCase()}-${j + 1}`,
        title: task,
        category: categoryForGap(task),
        completed: dayItem.status === 'done',
        due: dueMap[i] || 'This Week',
      });
    });
  });
  return tasks;
}

function buildNotifications(resumeHistory, interviewHistory, gaps) {
  const notes = [];
  if (resumeHistory[0]) {
    notes.push({
      title: 'Resume analyzed',
      body: `Latest resume score: ${resumeHistory[0].score}/100 for ${resumeHistory[0].role_target || 'target role'}.`,
      read: false,
    });
  }
  if (interviewHistory[0]) {
    notes.push({
      title: 'Interview insight ready',
      body: `Latest interview score: ${interviewHistory[0].overall_score}/100. Focus next on structured answers.`,
      read: false,
    });
  }
  if (gaps.length) {
    notes.push({
      title: 'Top skill gap detected',
      body: `Priority gap: ${gaps[0]}. Add this to your daily plan.`,
      read: false,
    });
  }
  return notes.slice(0, 6);
}

export async function GET(req) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || 'demo-user';

    const stateRes = await fetch(`${backendUrl}/api/system/state?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (stateRes.ok) {
      const statePayload = await stateRes.json();
      const saved = statePayload?.state || {};
      if ((saved.tasks || []).length || (saved.roadmap || []).length || (saved.notifications || []).length) {
        return NextResponse.json(
          {
            skillGaps: saved.skill_gaps || [],
            roadmap: saved.roadmap || [],
            tasks: saved.tasks || [],
            notifications: saved.notifications || [],
            chatContext: saved.chat_context || {},
            chatHistory: saved.chat_history || [],
            chatSessions: saved.chat_sessions || [],
            activeChatSessionId: saved.active_chat_session_id || '',
          },
          { status: 200 }
        );
      }
    }

    const [resumeRes, interviewRes] = await Promise.all([
      fetch(`${backendUrl}/api/resume/history?limit=20&user_id=${encodeURIComponent(userId)}`, { method: 'GET', cache: 'no-store' }),
      fetch(`${backendUrl}/api/interview/history?limit=20&user_id=${encodeURIComponent(userId)}`, { method: 'GET', cache: 'no-store' }),
    ]);
    const resumePayload = await resumeRes.json();
    const interviewPayload = await interviewRes.json();
    const resumeHistory = resumeRes.ok ? (resumePayload.history || []) : [];
    const interviewHistory = interviewRes.ok ? (interviewPayload.history || []) : [];

    const gapBucket = new Map();
    resumeHistory.forEach((row) => {
      (row.skill_gap || []).forEach((gap) => {
        const key = String(gap || '').trim();
        if (!key) return;
        gapBucket.set(key, (gapBucket.get(key) || 0) + 1);
      });
    });
    const skillGaps = Array.from(gapBucket.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([gap]) => gap)
      .slice(0, 8);

    const roadmap = buildRoadmap(skillGaps);
    const tasks = buildTasks(roadmap);
    const notifications = buildNotifications(resumeHistory, interviewHistory, skillGaps);

    const avgResume = resumeHistory.length
      ? Math.round(resumeHistory.reduce((s, r) => s + Number(r.score || 0), 0) / resumeHistory.length)
      : 0;
    const avgInterview = interviewHistory.length
      ? Math.round(interviewHistory.reduce((s, r) => s + Number(r.overall_score || 0), 0) / interviewHistory.length)
      : 0;

    const generated = {
      skillGaps,
      roadmap,
      tasks,
      notifications: notifications.map((n, idx) => ({ ...n, id: `notif-${idx + 1}` })),
      chatContext: {
        avgResumeScore: avgResume,
        avgInterviewScore: avgInterview,
        topSkillGaps: skillGaps,
        latestRoleTarget: resumeHistory[0]?.role_target || '',
      },
      chatHistory: [],
      chatSessions: [],
      activeChatSessionId: `chat-${Date.now()}`,
    };

    await fetch(`${backendUrl}/api/system/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        tasks: generated.tasks,
        roadmap: generated.roadmap,
        notifications: generated.notifications,
        skill_gaps: generated.skillGaps,
        chat_context: generated.chatContext,
        chat_history: generated.chatHistory,
        chat_sessions: generated.chatSessions,
        active_chat_session_id: generated.activeChatSessionId,
      }),
    });

    return NextResponse.json(generated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate system insights' },
      { status: 500 }
    );
  }
}
