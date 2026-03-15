// ============================================================
// Types for AI Sales CRM — Notion MCP Challenge
// ============================================================

// -- Deal Pipeline Stages --
export const DEAL_STAGES = [
	"Lead",
	"Qualified",
	"Proposal",
	"Negotiation",
	"Closed Won",
	"Closed Lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

// -- Priority Levels --
export const PRIORITIES = ["Low", "Medium", "High"] as const;
export type Priority = (typeof PRIORITIES)[number];

// -- Activity Types --
export const ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// -- Lead Sources --
export const LEAD_SOURCES = [
	"Website",
	"Referral",
	"LinkedIn",
	"Cold Outreach",
	"Conference",
	"Other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

// -- Core Entities --

export interface Contact {
	id: string;
	name: string;
	email: string;
	company: string;
	role: string;
	leadScore: number;
	leadScoreNotes: string;
	source: LeadSource | string;
}

export interface Deal {
	id: string;
	name: string;
	contactId: string;
	contactName: string;
	stage: DealStage;
	value: number;
	closeDate: string;
	priority: Priority;
	nextAction: string;
}

export interface Activity {
	id: string;
	type: ActivityType;
	date: string;
	dealId: string;
	dealName: string;
	summary: string;
	rawNotes: string;
}

export interface Company {
	id: string;
	name: string;
	industry: string;
	size: string;
	website: string;
}

// -- API Response Types --

export interface ApiError {
	error: string;
	details?: string;
}

export interface DealsByStage {
	stage: DealStage;
	deals: Deal[];
}

export interface PipelineMetrics {
	totalDeals: number;
	totalValue: number;
	dealsByStage: Record<DealStage, number>;
	valueByStage: Record<DealStage, number>;
	winRate: number;
	weightedPipeline: number;
}

// -- AI Feature Types --

export interface LeadScoreResult {
	score: number;
	reasoning: string;
}

export interface PreCallBriefing {
	contactSummary: string;
	dealContext: string;
	talkingPoints: string[];
	knownObjections: string[];
	relationshipHistory: string;
	suggestedApproach: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

export interface GhostwriterResult {
	dealId: string;
	dealName: string;
	contactName: string;
	emailDraft: string;
	reminderCreated: boolean;
}
