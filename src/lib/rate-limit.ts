// ============================================================
// In-Memory Rate Limiter (no external dependencies)
// ============================================================

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store) {
		if (entry.resetAt < now) {
			store.delete(key);
		}
	}
}, 60_000);

interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

/**
 * Check if a request is allowed under the rate limit.
 * Uses IP-based identification via request headers.
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig,
): RateLimitResult {
	const now = Date.now();
	const entry = store.get(identifier);

	if (!entry || entry.resetAt < now) {
		store.set(identifier, { count: 1, resetAt: now + config.windowMs });
		return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
	}

	entry.count++;
	const allowed = entry.count <= config.maxRequests;
	return {
		allowed,
		remaining: Math.max(0, config.maxRequests - entry.count),
		resetAt: entry.resetAt,
	};
}

/**
 * Extract client identifier from request headers.
 */
export function getClientId(request: Request): string {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown"
	);
}

// Rate limit presets
export const RATE_LIMITS = {
	ai: { maxRequests: 20, windowMs: 60_000 },       // 20 req/min for AI endpoints
	data: { maxRequests: 100, windowMs: 60_000 },     // 100 req/min for data endpoints
} as const;
