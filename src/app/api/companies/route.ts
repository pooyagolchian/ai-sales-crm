import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseCompany } from "@/lib/notion-helpers";
import { NOTION_DS } from "@/lib/notion-schema";
import { checkRateLimit, getClientId, RATE_LIMITS } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/validation";
import type { Company } from "@/types";

export const runtime = "nodejs";

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, unknown> }>;
}

export async function GET(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:companies:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const result = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.companies,
		});

		const companies: Company[] = (result?.results ?? []).map((page) =>
			parseCompany(page as Parameters<typeof parseCompany>[0]),
		);

		return NextResponse.json({ companies });
	} catch (error) {
		await resetMcpClient();
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to fetch companies") },
			{ status: 500 },
		);
	}
}
