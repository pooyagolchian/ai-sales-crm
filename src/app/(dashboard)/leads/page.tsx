import { LeadsClient } from "@/components/leads/leads-client";
import { PageHeader } from "@/components/shared/page-header";

export default function LeadsPage() {
	return (
		<div className="space-y-4">
			<PageHeader
				title="Leads & Contacts"
				description="Manage your sales pipeline contacts with AI-powered scoring and qualification"
			/>
			<LeadsClient />
		</div>
	);
}
