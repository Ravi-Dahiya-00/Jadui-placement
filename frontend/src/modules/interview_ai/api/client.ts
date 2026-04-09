import type {
  AnswerSubmitRequest,
  AnswerSubmitResponse,
  InterviewResultResponse,
  InterviewStartRequest,
  InterviewStartResponse,
} from "../types";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

export const interviewApi = {
  start: (payload: InterviewStartRequest) =>
    request<InterviewStartResponse>("/interview/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  submitAnswer: (payload: AnswerSubmitRequest) =>
    request<AnswerSubmitResponse>("/interview/answer", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  result: (sessionId: string) =>
    request<InterviewResultResponse>(
      `/interview/result?session_id=${encodeURIComponent(sessionId)}`
    ),
};
