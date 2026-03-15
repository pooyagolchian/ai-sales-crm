import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { getDate, getRelation, getRichText, getSelect, getTitle } from "@/lib/notion-helpers";
import { NOTION_DB, NOTION_DS } from "@/lib/notion-schema";
import type { Activity } from "@/types";

export const runtime = "nodejs";

type NotionProperty = Record<string, unknown>;

function parseActivity(page: { id: string; properties: Record<string, NotionProperty> }): Activity {
	const p = page.properties;
	return {
		id: page.id,
		type: (getSelect(p, "Type") || "note") as Activity["type"],
		date: getDate(p, "Date"),
		dealId: getRelation(p, "Deal"),
		dealName: "",
		summary: getTitle(p, "Summary"),
		rawNotes: getRichText(p, "Raw Notes"),
	};
}

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, NotionProperty> }>;
}

export async function GET() {
	try {
		const result = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.activities,
			sorts: [{ property: "Date", direction: "descending" }],
		});

		const activities: Activity[] = (result?.results ?? []).map((page) =>
			parseActivity(page as Parameters<typeof parseActivity>[0]),
		);

		return NextResponse.json({ activities });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to fetch activities";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { type, date, dealId, summary, rawNotes } = body;

		if (!summary) {
			return NextResponse.json({ error: "Summary is required" }, { status: 400 });
		}

		const properties: Record<string, unknown> = {
			Summary: { title: [{ text: { content: summary } }] },
		};

		if (type) {
			properties.Type = { select: { name: type } };
		}
		if (date) {
			properties.Date = { date: { start: date } };
		}
		if (dealId) {
			properties.Deal = { relation: [{ id: dealId }] };
		}
		if (rawNotes) {
			properties["Raw Notes"] = { rich_text: [{ text: { content: rawNotes } }] };
		}

		const result = await callMcpTool<{ id: string; properties: Record<string, NotionProperty> }>(
			"API-post-page",
			{
				parent: { database_id: NOTION_DB.activities },
				properties,
			},
		);

		const activity = parseActivity(result as Parameters<typeof parseActivity>[0]);
		return NextResponse.json({ activity }, { status: 201 });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to create activity";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
