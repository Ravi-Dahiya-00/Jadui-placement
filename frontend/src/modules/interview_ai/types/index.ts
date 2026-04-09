export type InterviewStartRequest = {
  role: string;
  skills: string[];
  level?: string;
  interview_type?: string;
  question_count?: number;
};

export type InterviewStartResponse = {
  session_id: string;
  role: string;
  skills: string[];
  level: string;
  interview_type: string;
  questions: string[];
};

export type AnswerSubmitRequest = {
  session_id: string;
  question_index: number;
  answer: string;
};

export type AnswerEvaluation = {
  correctness: number;
  clarity: number;
  relevance: number;
  overall: number;
  feedback: string;
  suggestions: string[];
  question_index: number;
  question: string;
  answer: string;
  created_at: string;
};

export type AnswerSubmitResponse = {
  evaluation: AnswerEvaluation;
};

export type InterviewResultResponse = {
  session_id: string;
  role: string;
  scores: {
    correctness: number;
    clarity: number;
    relevance: number;
    overall: number;
  };
  summary_feedback: string;
  answered_count: number;
  total_questions: number;
  evaluations: AnswerEvaluation[];
};
