import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function GET() {
    return new Response(JSON.stringify({ success: true, data: "Interview Generate API OK" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { type, role, level, techstack, amount, userid } = body;

        if (!role || !amount) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields: role, amount" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-exp"), // Using Google GenAI as originally implemented in PulseAI
            prompt: `Prepare questions for a job interview.
                        The job role is ${role}.
                        The job experience level is ${level || "not specified"}.
                        The tech stack used in the job is: ${techstack || "not specified"}.
                        The focus between behavioural and technical questions should lean towards: ${type || "balanced"}.
                        The amount of questions required is: ${amount || "5"}.
                        Please return only the questions as a JSON array: ["Question 1", "Question 2"].
                        Do not include any extra text or special characters.`,
        });

        let parsedQuestions;
        try {
            parsedQuestions = JSON.parse(questions);
            if (!Array.isArray(parsedQuestions)) {
                throw new Error("Questions must be returned as an array");
            }
        } catch (e) {
            console.error("Failed to parse questions:", questions);
            return new Response(
                JSON.stringify({ success: false, error: "Invalid question format from model" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // We will mock saving the interview ID here instead of calling firebase.
        // It should be handled seamlessly in Supabase if we want to save it persistently on the Frontend Action side.
        const interviewId = `iv-${Date.now()}`;

        return new Response(
            JSON.stringify({
                success: true,
                interviewId: interviewId,
                questions: parsedQuestions,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error generating interview:", error);
        return new Response(
            JSON.stringify({ success: false, error: error?.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
