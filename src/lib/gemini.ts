// ============================================================
// Gemini AI Helper — with mcpToTool() integration
// ============================================================
import { GoogleGenAI, mcpToTool } from "@google/genai";
import { getMcpClient } from "./mcp-client";
import {
	ACTIVITY_PROPS,
	COMPANY_PROPS,
	CONTACT_PROPS,
	DEAL_PROPS,
	NOTION_DB,
	NOTION_DS,
} from "./notion-schema";

function getGeminiClient(): GoogleGenAI {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error("Missing GEMINI_API_KEY environment variable");
	}
	return new GoogleGenAI({ apiKey });
}

const MODEL = "gemini-2.5-flash";

/**
 * Generate a response with Gemini that has full access to Notion MCP tools.
 * Gemini can autonomously call tools (search, query DB, create pages, etc.)
 */
export async function generateWithTools(prompt: string, systemPrompt?: string): Promise<string> {
	const ai = getGeminiClient();
	const mcpClient = await getMcpClient();

	const response = await ai.models.generateContent({
		model: MODEL,
		contents: prompt,
		config: {
			tools: [mcpToTool(mcpClient)],
			systemInstruction: systemPrompt || getCrmSystemPrompt(),
		},
	});

	return response.text ?? "";
}

/**
 * Generate a simple text response without tool access.
 * Use for tasks like lead scoring, email drafting, text extraction.
 */
export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
	const ai = getGeminiClient();

	const response = await ai.models.generateContent({
		model: MODEL,
		contents: prompt,
		config: {
			systemInstruction: systemPrompt,
		},
	});

	return response.text ?? "";
}

/**
 * Default system prompt for the CRM AI assistant.
 */
function getCrmSystemPrompt(): string {
	return `You are RevOps AI — an autonomous revenue operations assistant. You act as a virtual sales team manager, helping marketing directors and company managers build, manage, and follow up on their AI-powered sales team. You manage the pipeline, contacts, activities, and company data using Notion as the data layer.

You have access to Notion MCP tools that let you:
- Search for pages and databases
- Query databases with filters and sorts
- Create new pages (contacts, deals, activities)
- Update existing pages (move deals between stages, update fields)
- Retrieve page content and comments

== DATABASE IDs (use with API-post-page, parent: { database_id }) ==
- Contacts: ${NOTION_DB.contacts}
- Deals: ${NOTION_DB.deals}
- Activities: ${NOTION_DB.activities}
- Companies: ${NOTION_DB.companies}

== DATA SOURCE IDs (use with API-query-data-source, data_source_id) ==
- Contacts: ${NOTION_DS.contacts}
- Deals: ${NOTION_DS.deals}
- Activities: ${NOTION_DS.activities}
- Companies: ${NOTION_DS.companies}

== PROPERTY NAMES (must match exactly) ==
Contacts: ${Object.values(CONTACT_PROPS).join(", ")}
Deals: ${Object.values(DEAL_PROPS).join(", ")}
  - Stage values: Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
  - Priority values: Low, Medium, High
Activities: ${Object.values(ACTIVITY_PROPS).join(", ")}
  - Type values: call, email, meeting, note
Companies: ${Object.values(COMPANY_PROPS).join(", ")}

Guidelines:
- When creating or updating records, use the correct property names exactly as listed above
- For database queries, use data_source_id (not database_id)
- For creating pages, use database_id (not data_source_id)
- Format currency values as numbers (not strings)
- Format dates as ISO 8601 strings (YYYY-MM-DD)
- When asked about pipeline health, query the Deals database and analyze stages
- When logging activities, always link them to the relevant deal
- Be concise and actionable in your responses
- If you're unsure about something, query Notion first before making assumptions`;
}
