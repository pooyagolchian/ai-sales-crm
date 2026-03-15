import { LeadsClient } from "@/components/leads/leads-client";
import { PageHeader } from "@/components/shared/page-header";

export default function LeadsPage() {
	return (
		<div className="space-y-4">
			<PageHeader title="Leads" description="Manage your contacts and AI-powered lead scores" />
			<LeadsClient />
		</div>
	);
}
