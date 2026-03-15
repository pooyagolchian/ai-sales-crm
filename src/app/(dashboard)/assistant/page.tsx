import { PageHeader } from "@/components/shared/page-header";

export default function AssistantPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="AI Assistant"
				description="Control your CRM with natural language — powered by Gemini + Notion MCP"
			/>

			<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
				<p className="text-lg font-medium">AI Chat Interface</p>
				<p className="text-sm">Agentic chat with mcpToTool() will be implemented in Phase 4</p>
			</div>
		</div>
	);
}
