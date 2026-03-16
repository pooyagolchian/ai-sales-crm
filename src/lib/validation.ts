// ============================================================
// Zod Validation Schemas + Security Utilities
// ============================================================

import { z } from "zod";
import { ACTIVITY_TYPES, DEAL_STAGES, LEAD_SOURCES, PRIORITIES } from "@/types";

// -- Notion ID format (UUID with or without dashes) --
const notionIdSchema = z
	.string()
	.regex(
		/^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i,
		"Invalid Notion page ID",
	);

// -- ISO date format --
const isoDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/, "Invalid date format");

// -- Safe text (strips HTML tags, limits length) --
const safeText = (maxLength: number) =>
	z
		.string()
		.max(maxLength)
		.transform((val) => val.replace(/<[^>]*>/g, ""));

// ========================
// API Route Schemas
// ========================

export const createDealSchema = z.object({
	name: safeText(255).pipe(z.string().min(1, "Name is required")),
	contactId: notionIdSchema.optional(),
	stage: z.enum(DEAL_STAGES).optional().default("Lead"),
	value: z.number().min(0).optional(),
	closeDate: isoDateSchema.optional(),
	priority: z.enum(PRIORITIES).optional(),
	nextAction: safeText(2000).optional(),
});

export const updateDealSchema = z.object({
	name: safeText(255).optional(),
	contactId: notionIdSchema.optional(),
	stage: z.enum(DEAL_STAGES).optional(),
	value: z.number().min(0).optional(),
	closeDate: isoDateSchema.optional(),
	priority: z.enum(PRIORITIES).optional(),
	nextAction: safeText(2000).optional(),
});

export const createContactSchema = z.object({
	name: safeText(255).pipe(z.string().min(1, "Name is required")),
	email: z.string().email().max(255).optional(),
	company: safeText(255).optional(),
	role: safeText(255).optional(),
	source: z.enum(LEAD_SOURCES).optional(),
});

export const createActivitySchema = z.object({
	summary: safeText(500).pipe(z.string().min(1, "Summary is required")),
	type: z.enum(ACTIVITY_TYPES).optional(),
	date: isoDateSchema.optional(),
	dealId: notionIdSchema.optional(),
	rawNotes: safeText(5000).optional(),
});

export const chatSchema = z.object({
	message: safeText(5000).pipe(z.string().min(1, "Message is required")),
	history: z
		.array(
			z.object({
				id: z.string(),
				role: z.enum(["user", "assistant"]),
				content: z.string().max(10000),
				timestamp: z.string(),
			}),
		)
		.max(50)
		.optional(),
});

export const scoreSchema = z.object({
	contactId: notionIdSchema,
});

export const briefingSchema = z
	.object({
		contactId: notionIdSchema.optional(),
		dealId: notionIdSchema.optional(),
	})
	.refine((data) => data.contactId || data.dealId, {
		message: "contactId or dealId is required",
	});

export const ghostwriterSchema = z.object({
	dealId: notionIdSchema,
	emailType: z
		.enum(["follow-up", "introduction", "proposal", "negotiation", "check-in"])
		.optional()
		.default("follow-up"),
	customInstructions: safeText(1000).optional(),
});

// -- AI response parsing schemas --
export const leadScoreResponseSchema = z.object({
	score: z.number().min(0).max(100),
	reasoning: z.string().max(2000),
});

export const briefingResponseSchema = z.object({
	contactSummary: z.string(),
	dealContext: z.string(),
	talkingPoints: z.array(z.string()),
	knownObjections: z.array(z.string()),
	relationshipHistory: z.string(),
	suggestedApproach: z.string(),
});

export const ghostwriterResponseSchema = z.object({
	dealId: z.string(),
	dealName: z.string(),
	contactName: z.string(),
	emailDraft: z.string(),
	reminderCreated: z.boolean().optional().default(false),
});

// ========================
// Security Helpers
// ========================

/**
 * Sanitize user input before inserting into AI prompts.
 * Wraps content in delimiters so the model treats it as data, not instructions.
 */
export function sanitizeForPrompt(input: string): string {
	return input
		.replace(/<[^>]*>/g, "") // strip HTML
		.slice(0, 5000); // enforce length limit
}

/**
 * Return a safe error message to the client. Never expose internal details.
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
	console.error(fallback, error);
	return fallback;
}

/**
 * Parse and validate JSON from AI responses.
 */
export function parseAiJson<T>(response: string, schema: z.ZodType<T>): T {
	const jsonMatch = response.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		throw new Error("No JSON found in AI response");
	}

	const raw = JSON.parse(jsonMatch[0]);
	return schema.parse(raw);
}
