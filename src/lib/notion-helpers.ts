// ============================================================
// Notion Response Parsing Helpers
// ============================================================

import type { Deal, DealStage, Priority, Contact } from "@/types";

type NotionProperty = Record<string, unknown>;

function getTitle(props: Record<string, NotionProperty>, key: string): string {
	const prop = props[key] as { title?: Array<{ plain_text: string }> } | undefined;
	return prop?.title?.map((t) => t.plain_text).join("") ?? "";
}

function getRichText(props: Record<string, NotionProperty>, key: string): string {
	const prop = props[key] as { rich_text?: Array<{ plain_text: string }> } | undefined;
	return prop?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}

function getSelect(props: Record<string, NotionProperty>, key: string): string {
	const prop = props[key] as { select?: { name: string } | null } | undefined;
	return prop?.select?.name ?? "";
}

function getNumber(props: Record<string, NotionProperty>, key: string): number {
	const prop = props[key] as { number?: number | null } | undefined;
	return prop?.number ?? 0;
}

function getDate(props: Record<string, NotionProperty>, key: string): string {
	const prop = props[key] as { date?: { start: string } | null } | undefined;
	return prop?.date?.start ?? "";
}

function getEmail(props: Record<string, NotionProperty>, key: string): string {
	const prop = props[key] as { email?: string | null } | undefined;
	return prop?.email ?? "";
}

function getRelation(props: Record<string, NotionProperty>, key: string): string {
	const prop = props[key] as { relation?: Array<{ id: string }> } | undefined;
	return prop?.relation?.[0]?.id ?? "";
}

function getUrl(props: Record<string, NotionProperty>, key: string): string {
	const prop = props[key] as { url?: string | null } | undefined;
	return prop?.url ?? "";
}

// -- Parse a Notion page object into a Deal --
export function parseDeal(page: { id: string; properties: Record<string, NotionProperty> }): Deal {
	const p = page.properties;
	return {
		id: page.id,
		name: getTitle(p, "Name"),
		contactId: getRelation(p, "Contact"),
		contactName: "",
		stage: (getSelect(p, "Stage") || "Lead") as DealStage,
		value: getNumber(p, "Value"),
		closeDate: getDate(p, "Close Date"),
		priority: (getSelect(p, "Priority") || "Medium") as Priority,
		nextAction: getRichText(p, "Next Action"),
	};
}

// -- Parse a Notion page object into a Contact --
export function parseContact(
	page: { id: string; properties: Record<string, NotionProperty> },
): Contact {
	const p = page.properties;
	return {
		id: page.id,
		name: getTitle(p, "Name"),
		email: getEmail(p, "Email"),
		company: getRichText(p, "Company"),
		role: getRichText(p, "Role"),
		leadScore: getNumber(p, "Lead Score"),
		leadScoreNotes: getRichText(p, "Lead Score Notes"),
		source: getSelect(p, "Source"),
	};
}

export { getTitle, getRichText, getSelect, getNumber, getDate, getEmail, getRelation, getUrl };
