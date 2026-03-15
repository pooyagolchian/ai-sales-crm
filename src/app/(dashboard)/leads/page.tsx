import { PageHeader } from "@/components/shared/page-header";

export default function LeadsPage() {
	return (
		<div className="space-y-6">
			<PageHeader title="Leads" description="Manage your contacts and lead scores" />

			<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
				<p className="text-lg font-medium">Lead Management</p>
				<p className="text-sm">Contact list with AI lead scoring will be implemented in Phase 3</p>
			</div>
		</div>
	);
}
