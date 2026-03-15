import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { getDate, getRelation, getRichText, getSelect, getTitle } from "@/lib/notion-helpers";
import { NOTION_DS } from "@/lib/notion-schema";
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
