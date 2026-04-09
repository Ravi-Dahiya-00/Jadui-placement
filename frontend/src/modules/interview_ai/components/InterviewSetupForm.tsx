"use client";

import { useState } from "react";
import type { InterviewStartRequest } from "../types";

type Props = {
  onStart: (payload: InterviewStartRequest) => Promise<void> | void;
  loading?: boolean;
};

export function InterviewSetupForm({ onStart, loading }: Props) {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [level, setLevel] = useState("junior");
  const [interviewType, setInterviewType] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(5);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await onStart({
          role,
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          level,
          interview_type: interviewType,
          question_count: questionCount,
        });
      }}
    >
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role (e.g., Backend Engineer)"
        className="w-full rounded border p-2"
        required
      />
      <input
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        placeholder="Skills comma-separated (e.g., Python, FastAPI, SQL)"
        className="w-full rounded border p-2"
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="Level"
          className="rounded border p-2"
        />
        <input
          value={interviewType}
          onChange={(e) => setInterviewType(e.target.value)}
          placeholder="Type"
          className="rounded border p-2"
        />
        <input
          type="number"
          min={1}
          max={20}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="rounded border p-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Starting..." : "Start Interview"}
      </button>
    </form>
  );
}
