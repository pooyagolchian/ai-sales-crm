// ============================================================
// Notion Database Schema — Single Source of Truth
// ============================================================

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

// -- Database IDs (for creating pages via API-post-page) --
export const NOTION_DB = {
	get contacts() {
		return requireEnv("NOTION_CONTACTS_DB_ID");
	},
	get deals() {
		return requireEnv("NOTION_DEALS_DB_ID");
	},
	get activities() {
		return requireEnv("NOTION_ACTIVITIES_DB_ID");
	},
	get companies() {
		return requireEnv("NOTION_COMPANIES_DB_ID");
	},
} as const;

// -- Data Source IDs (for querying via API-query-data-source) --
export const NOTION_DS = {
	get contacts() {
		return requireEnv("NOTION_CONTACTS_DS_ID");
	},
	get deals() {
		return requireEnv("NOTION_DEALS_DS_ID");
	},
	get activities() {
		return requireEnv("NOTION_ACTIVITIES_DS_ID");
	},
	get companies() {
		return requireEnv("NOTION_COMPANIES_DS_ID");
	},
} as const;

// -- Property Names (must match Notion DB column names exactly) --

export const CONTACT_PROPS = {
	name: "Name",
	email: "Email",
	company: "Company",
	role: "Role",
	leadScore: "Lead Score",
	leadScoreNotes: "Lead Score Notes",
	source: "Source",
} as const;

export const DEAL_PROPS = {
	name: "Name",
	contact: "Contact",
	stage: "Stage",
	value: "Value",
	closeDate: "Close Date",
	priority: "Priority",
	nextAction: "Next Action",
} as const;

export const ACTIVITY_PROPS = {
	type: "Type",
	date: "Date",
	deal: "Deal",
	summary: "Summary",
	rawNotes: "Raw Notes",
} as const;

export const COMPANY_PROPS = {
	name: "Name",
	industry: "Industry",
	size: "Size",
	website: "Website",
} as const;
