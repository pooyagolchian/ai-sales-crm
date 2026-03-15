import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { NOTION_DB } from "@/lib/notion-schema";
import { parseContact } from "@/lib/notion-helpers";
import type { Contact } from "@/types";

export const runtime = "nodejs";

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, unknown> }>;
}

export async function GET() {
	try {
		const result = await callMcpTool<NotionQueryResult>("notion-query-database", {
			data_source_id: NOTION_DB.contacts,
		});

		const contacts: Contact[] = (result?.results ?? []).map((page) =>
			parseContact(page as Parameters<typeof parseContact>[0]),
		);

		return NextResponse.json({ contacts });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to fetch contacts";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, email, company, role, source } = body;

		if (!name) {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		const properties: Record<string, unknown> = {
			Name: { title: [{ text: { content: name } }] },
		};

		if (email) {
			properties.Email = { email };
		}
		if (company) {
			properties.Company = { rich_text: [{ text: { content: company } }] };
		}
		if (role) {
			properties.Role = { rich_text: [{ text: { content: role } }] };
		}
		if (source) {
			properties.Source = { select: { name: source } };
		}

		const result = await callMcpTool<{ id: string; properties: Record<string, unknown> }>(
			"notion-create-page",
			{
				data_source_id: NOTION_DB.contacts,
				properties,
			},
		);

		const contact = parseContact(result as Parameters<typeof parseContact>[0]);
		return NextResponse.json({ contact }, { status: 201 });
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to create contact";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
