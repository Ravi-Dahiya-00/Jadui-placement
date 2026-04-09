'use client'

import React from "react"
import { Play } from "lucide-react"

export default function InterviewCard({ id, role, type, score, date, summary }) {
    const badgeColor =
        type === "Behavioral" ? "bg-primary/20 text-primary" :
        type === "Technical" ? "bg-accent/20 text-accent" :
        "bg-secondary/20 text-secondary";

    const formattedDate = date ? new Date(date).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
    }) : "Recently";

    return (
        <div className="bg-surface border border-border hover:border-border/80 transition-all rounded-2xl w-full min-h-[320px] shadow-sm relative overflow-hidden group">
            <div className="p-6 flex flex-col h-full">
                {/* Badge */}
                <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-xl ${badgeColor}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">{type || "Mixed"}</span>
                </div>

                {/* Header info */}
                <div className="mt-8 flex flex-col items-center flex-1">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 flex items-center justify-center mb-4 border border-white/5">
                        <span className="text-2xl">🎙️</span>
                    </div>

                    <h3 className="text-xl font-bold text-white capitalize text-center">
                        {role} Interview
                    </h3>
                </div>

                {/* Score & Date */}
                <div className="flex justify-center gap-6 mt-4 text-muted text-sm border-y border-border/50 py-3">
                    <div className="flex items-center gap-1.5 font-semibold">
                        <span className="text-warning">★</span> {score ?? "---"} / 100
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                        <span>📅</span> {formattedDate}
                    </div>
                </div>

                {/* Summary */}
                <p className="mt-4 line-clamp-3 text-center text-sm text-muted/80 leading-relaxed min-h-[60px]">
                    {summary ?? "No feedback provided for this session. It might have been interrupted."}
                </p>

                {/* Action Button */}
                <div className="mt-6">
                    <button className="w-full flex items-center justify-center gap-2 bg-background border border-border text-white text-sm font-semibold rounded-xl py-3 hover:bg-white/5 transition-colors">
                        <Play className="w-4 h-4" />
                        {summary ? "Review Transcript" : "Restart Session"}
                    </button>
                </div>
            </div>
        </div>
    );
}
