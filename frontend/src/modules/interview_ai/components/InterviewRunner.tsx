"use client";

import { useState } from "react";
import type { AnswerEvaluation } from "../types";

type Props = {
  question?: string;
  index: number;
  total: number;
  loading?: boolean;
  onSubmit: (answer: string) => Promise<AnswerEvaluation | null | undefined>;
};

export function InterviewRunner({ question, index, total, loading, onSubmit }: Props) {
  const [answer, setAnswer] = useState("");
  const [latestEvaluation, setLatestEvaluation] = useState<AnswerEvaluation | null>(null);

  if (!question) {
    return <p className="text-sm text-gray-600">All questions attempted. View final result.</p>;
  }

  return (
    <div className="space-y-3 rounded border p-4">
      <p className="text-sm text-gray-500">
        Question {index + 1} of {total}
      </p>
      <p className="font-medium">{question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        className="w-full rounded border p-2"
        placeholder="Type your answer here..."
      />
      <button
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={loading || !answer.trim()}
        onClick={async () => {
          const evaluation = await onSubmit(answer);
          setAnswer("");
          if (evaluation) setLatestEvaluation(evaluation);
        }}
      >
        {loading ? "Submitting..." : "Submit Answer"}
      </button>

      {latestEvaluation && (
        <div className="rounded bg-gray-50 p-3 text-sm">
          <p>Overall: {latestEvaluation.overall}/100</p>
          <p>Feedback: {latestEvaluation.feedback}</p>
        </div>
      )}
    </div>
  );
}
