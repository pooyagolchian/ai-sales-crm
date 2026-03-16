import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseCompany } from "@/lib/notion-helpers";
import { NOTION_DS } from "@/lib/notion-schema";
import type { Company } from "@/types";

export const runtime = "nodejs";

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, unknown> }>;
}

export async function GET() {
	try {
		const result = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.companies,
		});

		const companies: Company[] = (result?.results ?? []).map((page) =>
			parseCompany(page as Parameters<typeof parseCompany>[0]),
		);

		return NextResponse.json({ companies });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to fetch companies";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
