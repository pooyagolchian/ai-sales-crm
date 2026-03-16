import { CompaniesClient } from "@/components/companies/companies-client";
import { PageHeader } from "@/components/shared/page-header";

export default function CompaniesPage() {
	return (
		<div className="space-y-4">
			<PageHeader
				title="Companies"
				description="Organization profiles linked to your contacts and deals"
			/>
			<CompaniesClient />
		</div>
	);
}
