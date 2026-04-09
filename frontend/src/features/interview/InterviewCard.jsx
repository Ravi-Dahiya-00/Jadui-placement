'use client'

import React from "react"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

export default function InterviewCard({ id, role, type, score, date, summary }) {
    const badgeColor =
        type === "Behavioral" ? "bg-primary/20 text-primary" :
        type === "Technical" ? "bg-accent/20 text-accent" :
        "bg-secondary/20 text-secondary";

    const formattedDate = date ? new Date(date).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
    }) : "Recently";

    return (
        <div className={cn(
            "glass relative border border-border group overflow-hidden rounded-2xl transition-all duration-500",
            "hover:border-primary/40 hover:shadow-glow translate-y-0 hover:-translate-y-1",
            "w-full min-h-[340px]"
        )}>
            {/* Background Accent orbs */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 -mr-16 -mt-16 transition-colors duration-500",
                type === "Technical" ? "bg-accent" : type === "Behavioral" ? "bg-primary" : "bg-secondary"
            )} />
            
            <div className="p-8 flex flex-col h-full relative z-10">
                {/* Badge Tag */}
                <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10",
                        badgeColor
                    )}>
                        {type || "Mixed Mode"}
                    </div>
                </div>

                {/* Header Profile Icon */}
                <div className="flex flex-col items-center flex-1">
                    <div className="w-20 h-20 rounded-2xl glass-light flex items-center justify-center mb-5 border border-white/5 relative group-hover:scale-110 transition-transform duration-500 shadow-xl">
                        <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">🎙️</span>
                    </div>

                    <h3 className="text-2xl font-black text-white capitalize text-center tracking-tight">
                        {role} <span className="text-muted block text-xs font-bold uppercase tracking-widest mt-1">Interview Session</span>
                    </h3>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-px bg-border/20 rounded-xl overflow-hidden mt-6 border border-border/30">
                    <div className="bg-surface/40 p-3 text-center">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Score</p>
                        <p className="text-sm font-black text-warning flex items-center justify-center gap-1">
                            {score ?? "--"}<span className="text-[10px] text-muted">/100</span>
                        </p>
                    </div>
                    <div className="bg-surface/40 p-3 text-center">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Completed</p>
                        <p className="text-sm font-black text-white">{formattedDate}</p>
                    </div>
                </div>

                {/* Action */}
                <div className="mt-8">
                    <button className={cn(
                        "w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl py-4 transition-all duration-300",
                        summary 
                            ? "bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white"
                            : "bg-surface/60 border border-border text-white hover:border-primary/40 hover:bg-primary/10"
                    )}>
                        {summary ? "Review Analysis" : "Resume Session"}
                    </button>
                </div>
            </div>
        </div>
    );
}
