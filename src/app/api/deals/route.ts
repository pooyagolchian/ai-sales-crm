import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseDeal } from "@/lib/notion-helpers";
import { NOTION_DB, NOTION_DS } from "@/lib/notion-schema";
import type { Deal, DealStage } from "@/types";

export const runtime = "nodejs";

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, unknown> }>;
}

export async function GET() {
	try {
		const result = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.deals,
		});

		const deals: Deal[] = (result?.results ?? []).map((page) =>
			parseDeal(page as Parameters<typeof parseDeal>[0]),
		);

		return NextResponse.json({ deals });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to fetch deals";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, contactId, stage, value, closeDate, priority, nextAction } = body;

		if (!name) {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		const properties: Record<string, unknown> = {
			Name: { title: [{ text: { content: name } }] },
			Stage: { select: { name: (stage as DealStage) || "Lead" } },
		};

		if (contactId) {
			properties.Contact = { relation: [{ id: contactId }] };
		}
		if (value !== undefined) {
			properties.Value = { number: value };
		}
		if (closeDate) {
			properties["Close Date"] = { date: { start: closeDate } };
		}
		if (priority) {
			properties.Priority = { select: { name: priority } };
		}
		if (nextAction) {
			properties["Next Action"] = { rich_text: [{ text: { content: nextAction } }] };
		}

		const result = await callMcpTool<{ id: string; properties: Record<string, unknown> }>(
			"API-post-page",
			{
				parent: { database_id: NOTION_DB.deals },
				properties,
			},
		);

		const deal = parseDeal(result as Parameters<typeof parseDeal>[0]);
		return NextResponse.json({ deal }, { status: 201 });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to create deal";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
