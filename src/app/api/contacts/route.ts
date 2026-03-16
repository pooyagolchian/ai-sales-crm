import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { parseContact } from "@/lib/notion-helpers";
import { NOTION_DB, NOTION_DS } from "@/lib/notion-schema";
import { checkRateLimit, getClientId, RATE_LIMITS } from "@/lib/rate-limit";
import { createContactSchema, safeErrorMessage } from "@/lib/validation";
import type { Contact } from "@/types";

export const runtime = "nodejs";

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, unknown> }>;
}

export async function GET(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:contacts:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const result = await callMcpTool<NotionQueryResult>("API-query-data-source", {
			data_source_id: NOTION_DS.contacts,
		});

		const contacts: Contact[] = (result?.results ?? []).map((page) =>
			parseContact(page as Parameters<typeof parseContact>[0]),
		);

		return NextResponse.json({ contacts });
	} catch (error) {
		await resetMcpClient();
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to fetch contacts") },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const clientId = getClientId(request);
		const rateLimit = checkRateLimit(`data:contacts:${clientId}`, RATE_LIMITS.data);
		if (!rateLimit.allowed) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
		}

		const body = await request.json();
		const parsed = createContactSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
		}

		const { name, email, company, role, source } = parsed.data;

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
			"API-post-page",
			{
				parent: { database_id: NOTION_DB.contacts },
				properties,
			},
		);

		const contact = parseContact(result as Parameters<typeof parseContact>[0]);
		return NextResponse.json({ contact }, { status: 201 });
	} catch (error) {
		await resetMcpClient();
		return NextResponse.json(
			{ error: safeErrorMessage(error, "Failed to create contact") },
			{ status: 500 },
		);
	}
}
