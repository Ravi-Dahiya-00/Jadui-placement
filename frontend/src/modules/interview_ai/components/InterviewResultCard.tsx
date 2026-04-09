"use client";

import type { InterviewResultResponse } from "../types";

type Props = {
  result: InterviewResultResponse | null;
};

export function InterviewResultCard({ result }: Props) {
  if (!result) return null;

  return (
    <section className="space-y-2 rounded border p-4">
      <h3 className="text-lg font-semibold">Interview Result</h3>
      <p>Overall Score: {result.scores.overall}/100</p>
      <p>Correctness: {result.scores.correctness}/100</p>
      <p>Clarity: {result.scores.clarity}/100</p>
      <p>Relevance: {result.scores.relevance}/100</p>
      <p className="text-sm text-gray-700">{result.summary_feedback}</p>
    </section>
  );
}
