import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseDeal } from "@/lib/notion-helpers";
import type { DealStage, Priority } from "@/types";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await request.json();
		const properties: Record<string, unknown> = {};

		if (body.name) {
			properties.Name = { title: [{ text: { content: body.name } }] };
		}
		if (body.stage) {
			properties.Stage = { select: { name: body.stage as DealStage } };
		}
		if (body.contactId) {
			properties.Contact = { relation: [{ id: body.contactId }] };
		}
		if (body.value !== undefined) {
			properties.Value = { number: body.value };
		}
		if (body.closeDate) {
			properties["Close Date"] = { date: { start: body.closeDate } };
		}
		if (body.priority) {
			properties.Priority = { select: { name: body.priority as Priority } };
		}
		if (body.nextAction !== undefined) {
			properties["Next Action"] = {
				rich_text: [{ text: { content: body.nextAction } }],
			};
		}

		const result = await callMcpTool<{ id: string; properties: Record<string, unknown> }>(
			"API-patch-page",
			{
				page_id: id,
				properties,
			},
		);

		const deal = parseDeal(result as Parameters<typeof parseDeal>[0]);
		return NextResponse.json({ deal });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to update deal";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
