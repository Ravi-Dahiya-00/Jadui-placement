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

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
            return new Response(
                JSON.stringify({ success: false, error: "NEXT_PUBLIC_BACKEND_URL is not configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
        const targetSkills =
            typeof techstack === "string"
                ? techstack.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

        const response = await fetch(`${backendUrl}/api/interview/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role,
                skills: targetSkills,
                level: level || "not specified",
                interview_type: type || "mixed",
                question_count: amount || 5,
                user_id: userid || null,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            return new Response(
                JSON.stringify({ success: false, error: data?.detail || "Backend interview start failed" }),
                { status: response.status, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                interviewId: data.session_id,
                questions: data.questions || [],
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
