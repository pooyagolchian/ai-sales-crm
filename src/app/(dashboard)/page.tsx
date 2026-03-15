import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
	return (
		<div className="space-y-6">
			<PageHeader title="Dashboard" description="Overview of your sales pipeline and key metrics" />

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard title="Total Deals" value="—" description="Loading..." />
				<MetricCard title="Pipeline Value" value="—" description="Loading..." />
				<MetricCard title="Win Rate" value="—" description="Loading..." />
				<MetricCard title="Weighted Pipeline" value="—" description="Loading..." />
			</div>

			<div className="rounded-lg border bg-card p-6 text-card-foreground">
				<h2 className="mb-2 text-lg font-semibold">Getting Started</h2>
				<ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
					<li>Set up your Notion databases (Contacts, Deals, Activities, Companies)</li>
					<li>
						Add your database IDs to <code>.env.local</code>
					</li>
					<li>
						Start the MCP server with <code>npm run mcp</code>
					</li>
					<li>Navigate to Pipeline to see your deals</li>
					<li>Try the AI Assistant to manage your CRM with natural language</li>
				</ol>
			</div>
		</div>
	);
}
