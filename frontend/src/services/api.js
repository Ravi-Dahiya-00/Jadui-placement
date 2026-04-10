import axios from 'axios'

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor — attach auth token ──────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Standard Auth
      const token = localStorage.getItem('auth_token')
      if (token) config.headers.Authorization = `Bearer ${token}`

      // Admin Security
      if (config.url?.includes('/admin')) {
        const adminToken = sessionStorage.getItem('admin_token')
        if (adminToken) config.headers['X-Admin-Token'] = adminToken
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor — normalise errors ──────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

// ─── Resume Module ─────────────────────────────────────────────

export const resumeAPI = {
  /** Upload a PDF resume file */
  upload: (formData) =>
    api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** Get analysis results for the current user's resume */
  getAnalysis: () => api.get('/resume/analysis'),
}

// ─── Tasks Module ──────────────────────────────────────────────

export const tasksAPI = {
  /** Fetch all tasks for the user */
  getAll: () => api.get('/tasks'),

  /** Mark a task as complete */
  complete: (taskId) => api.patch(`/tasks/${taskId}/complete`),

  /** Fetch the weekly roadmap */
  getRoadmap: () => api.get('/tasks/roadmap'),
}

// ─── Interview Module ─────────────────────────────────────────

export const interviewAPI = {
  /** Start a new interview session for a given role */
  start: (role) => api.post('/interview/start', { role }),

  /** Submit an answer to the current question */
  answer: (sessionId, questionId, answer) =>
    api.post('/interview/answer', { session_id: sessionId, question_id: questionId, answer }),

  /** Get feedback for a completed session */
  getFeedback: (sessionId) => api.get(`/interview/feedback/${sessionId}`),
}

// ─── AI Mentor Chat ────────────────────────────────────────────
// Mentor uses the Next.js route `POST /api/mentor/chat` (Gemini + dashboard context).
// Call `fetch('/api/mentor/chat', ...)` from client components — not the FastAPI base URL.

// ─── Progress Module ───────────────────────────────────────────

export const progressAPI = {
  /** Get all progress metrics for the dashboard */
  getSummary: () => api.get('/progress/summary'),

  /** Get skill progression data for charts */
  getSkills: () => api.get('/progress/skills'),
}

export default api
