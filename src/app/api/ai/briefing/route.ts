import { NextResponse } from "next/server";
import { generateWithTools } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { contactId, dealId } = body as {
			contactId?: string;
			dealId?: string;
		};

		if (!contactId && !dealId) {
			return NextResponse.json({ error: "contactId or dealId is required" }, { status: 400 });
		}

		const entityType = dealId ? "deal" : "contact";
		const entityId = dealId || contactId;

		const prompt = `Generate a comprehensive pre-call briefing for an upcoming sales call.

Look up the ${entityType} with ID "${entityId}" from Notion and gather all relevant information including:
- The contact's details (name, role, company, email)
- All related deals and their stages/values
- Recent activities and interactions
- Any notes or context from previous conversations

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

		// Parse the JSON response
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
		}

		const briefing = JSON.parse(jsonMatch[0]);

		return NextResponse.json(briefing);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to generate briefing";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
