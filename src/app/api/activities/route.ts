import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { getDate, getRelation, getRichText, getSelect, getTitle } from "@/lib/notion-helpers";
import { NOTION_DB, NOTION_DS } from "@/lib/notion-schema";
import { checkRateLimit, getClientId, RATE_LIMITS } from "@/lib/rate-limit";
import { createActivitySchema, safeErrorMessage } from "@/lib/validation";
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

export async function GET(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:activities:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

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
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to fetch activities") },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:activities:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const body = await request.json();
		const parsed = createActivitySchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
		}

		const { summary, type, date, dealId, rawNotes } = parsed.data;

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
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to create activity") },
			{ status: 500 },
		);
	}
}
