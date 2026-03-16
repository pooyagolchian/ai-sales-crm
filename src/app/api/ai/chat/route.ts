import { NextResponse } from "next/server";
import { generateWithTools } from "@/lib/gemini";
import { checkRateLimit, getClientId, RATE_LIMITS } from "@/lib/rate-limit";
import { chatSchema, safeErrorMessage, sanitizeForPrompt } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`ai:chat:${clientId}`, RATE_LIMITS.ai);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const body = await request.json();
		const parsed = chatSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
		}

		const { message, history } = parsed.data;

		// Build conversation context from history with clear delimiters
		const historyContext =
			history && history.length > 0
				? history
						.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${sanitizeForPrompt(m.content)}`)
						.join("\n\n")
				: "";

		const sanitizedMessage = sanitizeForPrompt(message);
		const fullPrompt = historyContext
			? `Previous conversation:\n${historyContext}\n\n---\nUser message (respond to this):\n${sanitizedMessage}`
			: sanitizedMessage;

		const response = await generateWithTools(fullPrompt);

		return NextResponse.json({ response });
	} catch (error) {
		return NextResponse.json(
			{ error: safeErrorMessage(error, "AI chat failed") },
			{ status: 500 },
		);
	}
}
