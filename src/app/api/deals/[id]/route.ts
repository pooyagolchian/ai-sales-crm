import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseDeal } from "@/lib/notion-helpers";
import { checkRateLimit, getClientId, RATE_LIMITS } from "@/lib/rate-limit";
import { safeErrorMessage, updateDealSchema } from "@/lib/validation";
import type { DealStage, Priority } from "@/types";

export const runtime = "nodejs";

const NOTION_ID_REGEX = /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:deals:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const { id } = await params;
		if (!NOTION_ID_REGEX.test(id)) {
			return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
		}

		const body = await request.json();
		const parsed = updateDealSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
		}

		const properties: Record<string, unknown> = {};

		if (parsed.data.name) {
			properties.Name = { title: [{ text: { content: parsed.data.name } }] };
		}
		if (parsed.data.stage) {
			properties.Stage = { select: { name: parsed.data.stage as DealStage } };
		}
		if (parsed.data.contactId) {
			properties.Contact = { relation: [{ id: parsed.data.contactId }] };
		}
		if (parsed.data.value !== undefined) {
			properties.Value = { number: parsed.data.value };
		}
		if (parsed.data.closeDate) {
			properties["Close Date"] = { date: { start: parsed.data.closeDate } };
		}
		if (parsed.data.priority) {
			properties.Priority = { select: { name: parsed.data.priority as Priority } };
		}
		if (parsed.data.nextAction !== undefined) {
			properties["Next Action"] = {
				rich_text: [{ text: { content: parsed.data.nextAction } }],
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
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to update deal") },
			{ status: 500 },
		);
	}
}
