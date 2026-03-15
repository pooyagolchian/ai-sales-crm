import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseContact } from "@/lib/notion-helpers";
import { NOTION_DS } from "@/lib/notion-schema";

export const runtime = "nodejs";

type NotionProperty = Record<string, unknown>;

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, NotionProperty> }>;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { contactId } = body;

		if (!contactId || typeof contactId !== "string") {
			return NextResponse.json({ error: "contactId is required" }, { status: 400 });
		}

		// Fetch the contact by retrieving the page
		const contactResult = await callMcpTool<{
			id: string;
			properties: Record<string, NotionProperty>;
		}>("API-retrieve-a-page", { page_id: contactId });

		if (!contactResult) {
			return NextResponse.json({ error: "Contact not found" }, { status: 404 });
		}

		const contact = parseContact(contactResult as Parameters<typeof parseContact>[0]);

		// Fetch deals related to this contact
		const dealsResult = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.deals,
			filter: {
				property: "Contact",
				relation: { contains: contactId },
			},
		});

		const dealCount = dealsResult?.results?.length ?? 0;
		const dealSummary = (dealsResult?.results ?? [])
			.map((d) => {
				const p = d.properties;
				const name =
					(
						p.Name as {
							title?: Array<{ plain_text: string }>;
						}
					)?.title
						?.map((t) => t.plain_text)
						.join("") ?? "";
				const stage = (p.Stage as { select?: { name: string } })?.select?.name ?? "";
				const value = (p.Value as { number?: number })?.number ?? 0;
				return `${name} (${stage}, $${value})`;
			})
			.join("; ");

		// Fetch activities related to the contact's deals
		const activitiesResult = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.activities,
			sorts: [{ property: "Date", direction: "descending" }],
			page_size: 10,
		});

		const activityCount = activitiesResult?.results?.length ?? 0;

		const prompt = `Analyze this sales lead and provide a score from 0-100 and a brief reasoning.

Contact Information:
- Name: ${contact.name}
- Email: ${contact.email}
- Company: ${contact.company}
- Role: ${contact.role}
- Source: ${contact.source}
- Current Score: ${contact.leadScore}

Sales Data:
- Number of deals: ${dealCount}
- Deals: ${dealSummary || "None"}
- Recent activities: ${activityCount} activities found

Scoring Criteria:
- Decision-maker roles (VP, Director, C-suite) = higher score
- Multiple active deals = higher score
- Recent engagement (activities) = higher score
- Enterprise company indicators = higher score
- Cold outreach with no engagement = lower score

Respond ONLY with valid JSON in this exact format:
{"score": <number 0-100>, "reasoning": "<1-2 sentence explanation>"}`;

		const aiResponse = await generateText(prompt);

		// Parse the AI response
		const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
		}

		const parsed = JSON.parse(jsonMatch[0]) as {
			score: number;
			reasoning: string;
		};
		const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
		const reasoning = parsed.reasoning;

		// Update the contact in Notion with the new score
		await callMcpTool("API-patch-page", {
			page_id: contactId,
			properties: {
				"Lead Score": { number: score },
				"Lead Score Notes": {
					rich_text: [{ text: { content: reasoning.slice(0, 2000) } }],
				},
			},
		});

		return NextResponse.json({ score, reasoning });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to score lead";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
