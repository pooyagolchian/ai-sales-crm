import { NextResponse } from "next/server";
import { generateWithTools } from "@/lib/gemini";
import type { ChatMessage } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { message, history } = body as {
			message: string;
			history?: ChatMessage[];
		};

		if (!message || typeof message !== "string") {
			return NextResponse.json({ error: "message is required" }, { status: 400 });
		}

		// Build conversation context from history
		const historyContext =
			history && history.length > 0
				? history
						.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
						.join("\n\n")
				: "";

		const fullPrompt = historyContext
			? `Previous conversation:\n${historyContext}\n\nUser: ${message}`
			: message;

		const response = await generateWithTools(fullPrompt);

		return NextResponse.json({ response });
	} catch (error) {
		const message = error instanceof Error ? error.message : "AI chat failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
