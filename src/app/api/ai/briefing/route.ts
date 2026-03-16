import { NextResponse } from "next/server";
import { generateWithTools } from "@/lib/gemini";
import { checkRateLimit, getClientId, RATE_LIMITS } from "@/lib/rate-limit";
import {
	briefingResponseSchema,
	briefingSchema,
	parseAiJson,
	safeErrorMessage,
	sanitizeForPrompt,
} from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`ai:briefing:${clientId}`, RATE_LIMITS.ai);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const body = await request.json();
		const parsed = briefingSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
		}

		const { contactId, dealId } = parsed.data;
		const entityType = dealId ? "deal" : "contact";
		const entityId = dealId || contactId;

		const prompt = `Generate a pre-call briefing for an upcoming sales call.

Look up the ${entityType} with the following ID from Notion and gather all relevant information including the contact's details, related deals and their stages/values, recent activities and interactions, and any notes from previous conversations.

<entity_id>${sanitizeForPrompt(entityId as string)}</entity_id>

Then produce a briefing in this exact JSON format:
{
  "contactSummary": "Brief overview of who this person is, their role and company",
  "dealContext": "Summary of active deals, stages, and values",
  "talkingPoints": ["Point 1", "Point 2", "Point 3"],
  "knownObjections": ["Potential objection 1", "Potential objection 2"],
  "relationshipHistory": "Summary of past interactions and engagement level",
  "suggestedApproach": "Recommended strategy for the call"
}

Respond ONLY with the JSON object, no markdown or extra text.`;

		const response = await generateWithTools(
			prompt,
			`You are a sales intelligence AI. You have access to the CRM's Notion database via MCP tools.
When looking up data, use the appropriate MCP tools to query the database.
Always return valid JSON in the exact format requested. Be specific and actionable in your briefing.`,
		);

		const briefing = parseAiJson(response, briefingResponseSchema);

		return NextResponse.json(briefing);
	} catch (error) {
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to generate briefing") },
			{ status: 500 },
		);
	}
}
