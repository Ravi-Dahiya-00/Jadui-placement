'use client'

import { createContext, useContext, useReducer, useEffect } from 'react'
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
  notifications: [],
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
      return { ...state, chatHistory: [...state.chatHistory, action.payload] }
    case ACTIONS.CLEAR_CHAT:
      return { ...state, chatHistory: [] }
    case ACTIONS.ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 10) }
    default:
      return state
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Restore session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser()
        dispatch({ type: ACTIONS.SET_USER, payload: user })
        if (user) seedMockProgress(dispatch)
      } catch {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false })
      }
    }
    loadUser()
  }, [])

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
