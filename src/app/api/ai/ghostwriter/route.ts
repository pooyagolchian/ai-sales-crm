import { NextResponse } from "next/server";
import { generateWithTools } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { dealId, emailType, customInstructions } = body as {
			dealId: string;
			emailType?: string;
			customInstructions?: string;
		};

		if (!dealId || typeof dealId !== "string") {
			return NextResponse.json({ error: "dealId is required" }, { status: 400 });
		}

		const type = emailType || "follow-up";

		const prompt = `Write a professional sales email for a deal.

Look up the deal with ID "${dealId}" from Notion. Get the deal name, stage, value, contact information, and any recent activities or notes.

Email type: ${type}
${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

Based on the deal's current stage and context, draft an appropriate ${type} email.

Return ONLY valid JSON in this exact format:
{
  "dealId": "${dealId}",
  "dealName": "Name of the deal",
  "contactName": "Name of the contact",
  "emailDraft": "The full email text including subject line formatted as:\\nSubject: ...\\n\\nHi [Name],\\n\\n[Body]\\n\\nBest regards,\\n[Sender]",
  "reminderCreated": false
}`;

		const response = await generateWithTools(
			prompt,
			`You are a sales email expert with access to a CRM's Notion database via MCP tools.
Write concise, professional emails tailored to the deal's stage:
- Lead/Qualified: Discovery and value proposition
- Proposal: Reference the proposal and address concerns
- Negotiation: Handle objections, create urgency
- Follow-up: Re-engage with new value or check-in
Keep emails under 200 words. Be warm but professional. Always return valid JSON.`,
		);

		// Parse the JSON response
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return NextResponse.json({ error: "Failed to generate email" }, { status: 500 });
		}

		const result = JSON.parse(jsonMatch[0]);

		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to generate email";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
