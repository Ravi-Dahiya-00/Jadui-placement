"use client";

import { useMemo, useState } from "react";
import { interviewApi } from "../api/client";
import type {
  AnswerEvaluation,
  InterviewResultResponse,
  InterviewStartRequest,
  InterviewStartResponse,
} from "../types";

export function useInterviewSession() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<InterviewStartResponse | null>(null);
  const [evaluations, setEvaluations] = useState<AnswerEvaluation[]>([]);
  const [result, setResult] = useState<InterviewResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestionIndex = evaluations.length;
  const currentQuestion = session?.questions[currentQuestionIndex];

  const progress = useMemo(() => {
    if (!session?.questions.length) return 0;
    return Math.round((evaluations.length / session.questions.length) * 100);
  }, [session?.questions.length, evaluations.length]);

  const startInterview = async (payload: InterviewStartRequest) => {
    try {
      setLoading(true);
      setError(null);
      setEvaluations([]);
      setResult(null);
      const data = await interviewApi.start(payload);
      setSession(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      const res = await interviewApi.submitAnswer({
        session_id: session.session_id,
        question_index: currentQuestionIndex,
        answer,
      });
      setEvaluations((prev) => [...prev, res.evaluation]);
      return res.evaluation;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async () => {
    if (!session) return null;
    try {
      setLoading(true);
      setError(null);
      const res = await interviewApi.result(session.session_id);
      setResult(res);
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch result");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    session,
    evaluations,
    result,
    currentQuestion,
    currentQuestionIndex,
    progress,
    startInterview,
    submitAnswer,
    fetchResult,
  };
}
