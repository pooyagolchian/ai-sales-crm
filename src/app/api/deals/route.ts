import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseDeal } from "@/lib/notion-helpers";
import { NOTION_DB, NOTION_DS } from "@/lib/notion-schema";
import { checkRateLimit, getClientId, RATE_LIMITS } from "@/lib/rate-limit";
import { createDealSchema, safeErrorMessage } from "@/lib/validation";
import type { Deal, DealStage } from "@/types";

export const runtime = "nodejs";

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, unknown> }>;
}

export async function GET(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:deals:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const result = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.deals,
		});

		const deals: Deal[] = (result?.results ?? []).map((page) =>
			parseDeal(page as Parameters<typeof parseDeal>[0]),
		);

		return NextResponse.json({ deals });
	} catch (error) {
		await resetMcpClient();
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to fetch deals") },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:deals:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const body = await request.json();
		const parsed = createDealSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
		}

		const { name, contactId, stage, value, closeDate, priority, nextAction } = parsed.data;

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
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to create deal") },
			{ status: 500 },
		);
	}
}
