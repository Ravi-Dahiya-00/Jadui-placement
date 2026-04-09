'use client'

import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react'
import { getCurrentUser } from '@/lib/supabase'

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  user:        null,
  isLoading:   true,
  isAuthenticated: false,
  resumeData:  null,
  tasks:       [],
  progress: {
    readinessScore:   0,
    taskCompletion:   0,
    interviewScore:   0,
    streak:           0,
    skillData:        [],
  },
  chatHistory: [],
  chatSessions: [],
  activeChatSessionId: '',
  notifications: [],
  roadmap: [],
  skillGaps: [],
  chatContext: null,
}

// ─── Action Types ──────────────────────────────────────────────────────────────

export const ACTIONS = {
  SET_USER:         'SET_USER',
  SET_LOADING:      'SET_LOADING',
  LOGOUT:           'LOGOUT',
  SET_RESUME:       'SET_RESUME',
  SET_TASKS:        'SET_TASKS',
  COMPLETE_TASK:    'COMPLETE_TASK',
  SET_PROGRESS:     'SET_PROGRESS',
  ADD_MESSAGE:      'ADD_MESSAGE',
  CLEAR_CHAT:       'CLEAR_CHAT',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  SET_SYSTEM_INSIGHTS: 'SET_SYSTEM_INSIGHTS',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  INIT_CHAT_SESSION: 'INIT_CHAT_SESSION',
  OPEN_CHAT_SESSION: 'OPEN_CHAT_SESSION',
  START_NEW_CHAT_SESSION: 'START_NEW_CHAT_SESSION',
}

// ─── Reducer ───────────────────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false }
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }
    case ACTIONS.LOGOUT:
      return { ...initialState, isLoading: false }
    case ACTIONS.SET_RESUME:
      return { ...state, resumeData: action.payload }
    case ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload }
    case ACTIONS.COMPLETE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload ? { ...t, completed: true } : t
        ),
      }
    case ACTIONS.SET_PROGRESS:
      return { ...state, progress: { ...state.progress, ...action.payload } }
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        chatHistory: [
          ...state.chatHistory,
          {
            ...action.payload,
            sessionId: state.activeChatSessionId || action.payload.sessionId || `chat-${Date.now()}`,
          },
        ],
      }
    case ACTIONS.CLEAR_CHAT:
      {
        const currentSessionId = state.activeChatSessionId || `chat-${Date.now()}`
        const archived = state.chatHistory.length
          ? [
              {
                id: currentSessionId,
                started_at: state.chatHistory[0]?.timestamp || new Date().toISOString(),
                ended_at: new Date().toISOString(),
                messages: state.chatHistory,
              },
              ...state.chatSessions,
            ]
          : state.chatSessions
        return {
          ...state,
          chatSessions: archived.slice(0, 30),
          chatHistory: [],
          activeChatSessionId: `chat-${Date.now()}`,
        }
      }
    case ACTIONS.ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 10) }
    case ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          String(n.id) === String(action.payload) ? { ...n, read: true } : n
        ),
      }
    case ACTIONS.SET_SYSTEM_INSIGHTS:
      {
        const nextTasks = action.payload.tasks ?? state.tasks
        const completed = nextTasks.filter((t) => t.completed).length
        const taskCompletion = nextTasks.length ? Math.round((completed / nextTasks.length) * 100) : 0
        const skillData = (action.payload.skillGaps || []).slice(0, 6).map((gap, idx) => ({
          name: gap,
          level: Math.max(25, 70 - (idx * 8)),
        }))
      return {
        ...state,
        tasks: nextTasks,
        roadmap: action.payload.roadmap ?? state.roadmap,
        skillGaps: action.payload.skillGaps ?? state.skillGaps,
        notifications: action.payload.notifications ?? state.notifications,
        chatContext: action.payload.chatContext ?? state.chatContext,
        chatHistory: action.payload.chatHistory ?? state.chatHistory,
        chatSessions: action.payload.chatSessions ?? state.chatSessions,
        activeChatSessionId: action.payload.activeChatSessionId ?? (state.activeChatSessionId || `chat-${Date.now()}`),
        progress: {
          ...state.progress,
          readinessScore: Math.round(((action.payload.chatContext?.avgResumeScore || 0) * 0.45) + ((action.payload.chatContext?.avgInterviewScore || 0) * 0.4) + (taskCompletion * 0.15)),
          taskCompletion,
          interviewScore: action.payload.chatContext?.avgInterviewScore || 0,
          skillData: skillData.length ? skillData : state.progress.skillData,
        },
      }
      }
    case ACTIONS.INIT_CHAT_SESSION:
      return {
        ...state,
        activeChatSessionId: state.activeChatSessionId || `chat-${Date.now()}`,
      }
    case ACTIONS.OPEN_CHAT_SESSION:
      {
        const target = state.chatSessions.find((s) => String(s.id) === String(action.payload))
        if (!target) return state
        return {
          ...state,
          activeChatSessionId: target.id,
          chatHistory: target.messages || [],
        }
      }
    case ACTIONS.START_NEW_CHAT_SESSION:
      return {
        ...state,
        activeChatSessionId: `chat-${Date.now()}`,
        chatHistory: [],
      }
    default:
      return state
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [readyToPersist, setReadyToPersist] = useState(false)
  const persistTimerRef = useRef(null)

  // Restore session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser()
        dispatch({ type: ACTIONS.SET_USER, payload: user })
        dispatch({ type: ACTIONS.INIT_CHAT_SESSION })
        if (user) {
          const res = await fetch(`/api/system/insights?user_id=${encodeURIComponent(user.id || 'demo-user')}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            dispatch({ type: ACTIONS.SET_SYSTEM_INSIGHTS, payload: data })
          } else {
            seedMockProgress(dispatch)
          }
        }
      } catch {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false })
      } finally {
        setReadyToPersist(true)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!readyToPersist || !state.user?.id) return
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/system/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: state.user.id,
            tasks: state.tasks,
            roadmap: state.roadmap,
            notifications: state.notifications,
            skill_gaps: state.skillGaps,
            chat_context: state.chatContext || {},
            chat_history: state.chatHistory || [],
            chat_sessions: state.chatSessions || [],
            active_chat_session_id: state.activeChatSessionId || '',
          }),
        })
      } catch {
        // no-op persistence fallback
      }
    }, 500)
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    }
  }, [readyToPersist, state.user?.id, state.tasks, state.roadmap, state.notifications, state.skillGaps, state.chatContext, state.chatHistory, state.chatSessions, state.activeChatSessionId])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

// ─── Mock data seeder for development / demo ───────────────────────────────────

function seedMockProgress(dispatch) {
  dispatch({
    type: ACTIONS.SET_PROGRESS,
    payload: {
      readinessScore: 72,
      taskCompletion: 58,
      interviewScore: 81,
      streak:         5,
      skillData: [
        { name: 'DSA',          level: 65 },
        { name: 'System Design',level: 48 },
        { name: 'React',        level: 82 },
        { name: 'Python',       level: 74 },
        { name: 'SQL',          level: 61 },
        { name: 'Communication',level: 78 },
      ],
    },
  })

  dispatch({
    type: ACTIONS.SET_TASKS,
    payload: [
      { id: '1', title: 'Solve 3 LeetCode Medium problems', category: 'DSA',     completed: true,  due: 'Today' },
      { id: '2', title: 'Complete System Design chapter 4',  category: 'Design',  completed: false, due: 'Today' },
      { id: '3', title: 'Mock interview — Behavioral round', category: 'Interview', completed: false, due: 'Today' },
      { id: '4', title: 'Build REST API with FastAPI',       category: 'Project', completed: true,  due: 'Yesterday' },
      { id: '5', title: 'Review DBMS concepts',              category: 'Core',    completed: false, due: 'Tomorrow' },
      { id: '6', title: 'Update LinkedIn profile summary',   category: 'Career',  completed: false, due: 'Tomorrow' },
    ],
  })
}
