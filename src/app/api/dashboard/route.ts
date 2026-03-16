import { NextResponse } from "next/server";
import { callMcpTool, resetMcpClient } from "@/lib/mcp-client";
import { getDate, getSelect, getTitle, parseContact, parseDeal } from "@/lib/notion-helpers";
import { NOTION_DS } from "@/lib/notion-schema";
import type { Contact, Deal, DealStage, PipelineMetrics } from "@/types";
import { DEAL_STAGES } from "@/types";

export const runtime = "nodejs";

type NotionProperty = Record<string, unknown>;

interface NotionQueryResult {
	results: Array<{ id: string; properties: Record<string, NotionProperty> }>;
}

const STAGE_WEIGHTS: Record<DealStage, number> = {
	Lead: 0.1,
	Qualified: 0.25,
	Proposal: 0.5,
	Negotiation: 0.75,
	"Closed Won": 1.0,
	"Closed Lost": 0,
};

export async function GET() {
	try {
		const [dealsResult, contactsResult, activitiesResult, companiesResult] = await Promise.all([
			callMcpTool<NotionQueryResult>("API-query-data-source", {
				data_source_id: NOTION_DS.deals,
			}),
			callMcpTool<NotionQueryResult>("API-query-data-source", {
				data_source_id: NOTION_DS.contacts,
			}),
			callMcpTool<NotionQueryResult>("API-query-data-source", {
				data_source_id: NOTION_DS.activities,
				sorts: [{ property: "Date", direction: "descending" }],
				page_size: 5,
			}),
			callMcpTool<NotionQueryResult>("API-query-data-source", {
				data_source_id: NOTION_DS.companies,
			}),
		]);

		const deals: Deal[] = (dealsResult?.results ?? []).map((page) =>
			parseDeal(page as Parameters<typeof parseDeal>[0]),
		);

		const contacts: Contact[] = (contactsResult?.results ?? []).map((page) =>
			parseContact(page as Parameters<typeof parseContact>[0]),
		);

		const recentActivities = (activitiesResult?.results ?? []).map((page) => {
			const p = (page as { properties: Record<string, NotionProperty> }).properties;
			return {
				id: (page as { id: string }).id,
				summary: getTitle(p, "Summary"),
				type: getSelect(p, "Type"),
				date: getDate(p, "Date"),
			};
		});

		// Compute metrics
		const dealsByStage = {} as Record<DealStage, number>;
		const valueByStage = {} as Record<DealStage, number>;
		for (const stage of DEAL_STAGES) {
			dealsByStage[stage] = 0;
			valueByStage[stage] = 0;
		}

		let totalValue = 0;
		let closedWon = 0;
		let closedTotal = 0;
		let weightedPipeline = 0;

		for (const deal of deals) {
			dealsByStage[deal.stage] = (dealsByStage[deal.stage] || 0) + 1;
			valueByStage[deal.stage] = (valueByStage[deal.stage] || 0) + deal.value;
			totalValue += deal.value;

			if (deal.stage === "Closed Won") closedWon++;
			if (deal.stage === "Closed Won" || deal.stage === "Closed Lost") closedTotal++;

			weightedPipeline += deal.value * (STAGE_WEIGHTS[deal.stage] ?? 0);
		}

		const winRate = closedTotal > 0 ? closedWon / closedTotal : 0;

		const metrics: PipelineMetrics = {
			totalDeals: deals.length,
			totalValue,
			dealsByStage,
			valueByStage,
			winRate,
			weightedPipeline,
		};

		// Top deals by value (active pipeline only)
		const activeDeals = deals
			.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost")
			.sort((a, b) => b.value - a.value)
			.slice(0, 5);

		// Top contacts by lead score
		const topContacts = [...contacts].sort((a, b) => b.leadScore - a.leadScore).slice(0, 5);

		const totalCompanies = companiesResult?.results?.length ?? 0;

		return NextResponse.json({
			metrics,
			activeDeals,
			topContacts,
			recentActivities,
			totalContacts: contacts.length,
			totalCompanies,
		});
	} catch (error) {
		await resetMcpClient();
		const message = error instanceof Error ? error.message : "Failed to fetch dashboard stats";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
