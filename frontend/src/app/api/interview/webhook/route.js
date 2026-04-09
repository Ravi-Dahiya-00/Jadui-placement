import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const toolCalls = body?.toolCalls || [];

        const results = [];

        for (const toolCall of toolCalls) {
            // Check if Vapi AI voice bot calls our tool named "generate_questions"
            if (toolCall.name === "generate_questions") {
                const input = {
                    ...toolCall.input,
                    userid: body?.conversation?.variables?.userid || "demo-user",
                };

                // Forward request to our local generation logic
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
                const response = await fetch(
                    `${baseUrl}/api/interview/generate`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(input),
                    }
                );

                const data = await response.json();

                // Reply to VAPI Voice Session
                results.push({
                    toolCallId: toolCall.id,
                    result: {
                        interviewId: data.interviewId,
                        questions: data.questions,
                    },
                });
            }
        }
        return NextResponse.json({ results });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
