// ============================================================
// MCP Client Singleton — Connects to Notion MCP Server
// ============================================================
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let client: Client | null = null;
let isConnecting = false;

function getMcpServerUrl(): string {
	return process.env.MCP_SERVER_URL || "http://localhost:3001/mcp";
}

async function createClient(): Promise<Client> {
	const mcpClient = new Client({
		name: "ai-sales-crm",
		version: "1.0.0",
	});

	const transport = new StreamableHTTPClientTransport(new URL(getMcpServerUrl()));

	await mcpClient.connect(transport);
	return mcpClient;
}

/**
 * Returns the singleton MCP client, creating/reconnecting if needed.
 */
export async function getMcpClient(): Promise<Client> {
	if (client) {
		return client;
	}

	if (isConnecting) {
		// Wait for the in-progress connection
		while (isConnecting) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		if (client) return client;
	}

	isConnecting = true;
	try {
		client = await createClient();
		return client;
	} catch (error) {
		client = null;
		throw error;
	} finally {
		isConnecting = false;
	}
}

/**
 * Calls an MCP tool and returns the parsed JSON result.
 * MCP tools return `{ content: [{ type: 'text', text: string }] }`.
 */
export async function callMcpTool<T = unknown>(
	name: string,
	args: Record<string, unknown>,
): Promise<T> {
	const mcpClient = await getMcpClient();
	const result = await mcpClient.callTool({ name, arguments: args });

	if (result.isError) {
		const errorText =
			result.content && Array.isArray(result.content)
				? (result.content as Array<{ text?: string }>).map((c) => c.text).join("\n")
				: "Unknown MCP error";
		throw new Error(`MCP tool "${name}" failed: ${errorText}`);
	}

	const textContent = (result.content as Array<{ type: string; text: string }>)?.find(
		(c) => c.type === "text",
	);

	if (!textContent?.text) {
		return undefined as T;
	}

	try {
		return JSON.parse(textContent.text) as T;
	} catch {
		return textContent.text as T;
	}
}

/**
 * Resets the client connection (useful for error recovery).
 */
export async function resetMcpClient(): Promise<void> {
	if (client) {
		try {
			await client.close();
		} catch {
			// Ignore close errors
		}
		client = null;
	}
}
