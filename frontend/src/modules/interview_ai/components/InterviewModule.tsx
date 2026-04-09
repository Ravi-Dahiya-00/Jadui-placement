"use client";

import { InterviewResultCard } from "./InterviewResultCard";
import { InterviewRunner } from "./InterviewRunner";
import { InterviewSetupForm } from "./InterviewSetupForm";
import { useInterviewSession } from "../hooks/useInterviewSession";

export function InterviewModule() {
  const {
    loading,
    error,
    session,
    result,
    currentQuestion,
    currentQuestionIndex,
    startInterview,
    submitAnswer,
    fetchResult,
  } = useInterviewSession();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <header>
        <h1 className="text-2xl font-bold">AI Mock Interview</h1>
        <p className="text-sm text-gray-600">
          Extracted from PulseAI and modularized for Agentic AI Career Coach.
        </p>
      </header>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {!session ? (
        <InterviewSetupForm onStart={startInterview} loading={loading} />
      ) : (
        <>
          <InterviewRunner
            question={currentQuestion}
            index={currentQuestionIndex}
            total={session.questions.length}
            loading={loading}
            onSubmit={submitAnswer}
          />

          <button
            className="rounded border px-4 py-2 text-sm"
            disabled={loading}
            onClick={fetchResult}
          >
            Get Interview Result
          </button>
        </>
      )}

      <InterviewResultCard result={result} />
    </main>
  );
}
