import { ChatClient } from "@/components/ai-chat/chat-client";
import { PageHeader } from "@/components/shared/page-header";

export default function AssistantPage() {
	return (
		<div className="space-y-4">
			<PageHeader
				title="AI Assistant"
				description="Control your CRM with natural language — powered by Gemini + Notion MCP"
			/>
			<ChatClient />
		</div>
	);
}
