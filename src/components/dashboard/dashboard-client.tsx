"use client";

import {
	Activity,
	ArrowUpRight,
	BarChart3,
	Calendar,
	DollarSign,
	FileText,
	Mail,
	Phone,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Contact, Deal, DealStage, PipelineMetrics } from "@/types";

interface DashboardData {
	metrics: PipelineMetrics;
	activeDeals: Deal[];
	topContacts: Array<Contact>;
	recentActivities: Array<{
		id: string;
		summary: string;
		type: string;
		date: string;
	}>;
	totalContacts: number;
	totalCompanies: number;
}

const STAGE_COLORS: Record<DealStage, string> = {
	Lead: "bg-slate-100 text-slate-700",
	Qualified: "bg-blue-100 text-blue-700",
	Proposal: "bg-violet-100 text-violet-700",
	Negotiation: "bg-amber-100 text-amber-700",
	"Closed Won": "bg-emerald-100 text-emerald-700",
	"Closed Lost": "bg-red-100 text-red-700",
};

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
	call: Phone,
	email: Mail,
	meeting: Calendar,
	note: FileText,
};

function formatCurrency(value: number): string {
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
	return `$${value}`;
}

export function DashboardClient() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchDashboard() {
			try {
				const res = await fetch("/api/dashboard");
				if (!res.ok) throw new Error("Failed to fetch dashboard");
				const json = await res.json();
				setData(json);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		}
		fetchDashboard();
	}, []);

	if (loading) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Dashboard"
					description="Overview of your sales pipeline and key metrics"
				/>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{["deals", "value", "rate", "weighted"].map((key) => (
						<Card key={key}>
							<CardHeader className="pb-2">
								<div className="h-4 w-24 animate-pulse rounded bg-muted" />
							</CardHeader>
							<CardContent>
								<div className="h-8 w-16 animate-pulse rounded bg-muted" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Dashboard"
					description="Overview of your sales pipeline and key metrics"
				/>
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<p className="text-sm text-destructive">{error || "Failed to load dashboard data"}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { metrics, activeDeals, topContacts, recentActivities, totalContacts, totalCompanies } =
		data;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Revenue Dashboard"
				description="AI-powered overview of your pipeline, team performance, and key revenue metrics"
			/>

			{/* Metric Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Total Deals"
					value={metrics.totalDeals}
					description={`${totalContacts} contacts · ${totalCompanies} companies`}
					icon={<Target className="h-4 w-4" />}
				/>
				<MetricCard
					title="Pipeline Value"
					value={formatCurrency(metrics.totalValue)}
					description="Across all stages"
					icon={<DollarSign className="h-4 w-4" />}
				/>
				<MetricCard
					title="Win Rate"
					value={`${(metrics.winRate * 100).toFixed(0)}%`}
					description="Closed deals"
					icon={<TrendingUp className="h-4 w-4" />}
				/>
				<MetricCard
					title="Weighted Pipeline"
					value={formatCurrency(metrics.weightedPipeline)}
					description="Probability-adjusted"
					icon={<BarChart3 className="h-4 w-4" />}
				/>
			</div>

			{/* Pipeline Stage Breakdown */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Pipeline by Stage</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{(Object.entries(metrics.dealsByStage) as [DealStage, number][])
							.filter(([, count]) => count > 0)
							.map(([stage, count]) => {
								const value = metrics.valueByStage[stage];
								const pct = metrics.totalValue > 0 ? (value / metrics.totalValue) * 100 : 0;
								return (
									<div key={stage} className="flex items-center gap-3">
										<Badge
											variant="secondary"
											className={cn("w-28 justify-center text-xs", STAGE_COLORS[stage])}
										>
											{stage}
										</Badge>
										<div className="flex-1">
											<div className="h-2 rounded-full bg-muted">
												<div
													className={cn("h-2 rounded-full transition-all", {
														"bg-slate-400": stage === "Lead",
														"bg-blue-500": stage === "Qualified",
														"bg-violet-500": stage === "Proposal",
														"bg-amber-500": stage === "Negotiation",
														"bg-emerald-500": stage === "Closed Won",
														"bg-red-400": stage === "Closed Lost",
													})}
													style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
												/>
											</div>
										</div>
										<span className="w-8 text-right text-sm font-medium">{count}</span>
										<span className="w-16 text-right text-sm text-muted-foreground">
											{formatCurrency(value)}
										</span>
									</div>
								);
							})}
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-2">
				{/* Top Active Deals */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<ArrowUpRight className="h-4 w-4" />
							Top Active Deals
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{activeDeals.map((deal) => (
								<div
									key={deal.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">{deal.name}</p>
										<div className="mt-1 flex items-center gap-2">
											<Badge
												variant="secondary"
												className={cn("text-xs", STAGE_COLORS[deal.stage])}
											>
												{deal.stage}
											</Badge>
											{deal.priority === "High" && (
												<Badge variant="destructive" className="text-xs">
													High
												</Badge>
											)}
										</div>
									</div>
									<p className="ml-4 text-sm font-semibold">{formatCurrency(deal.value)}</p>
								</div>
							))}
							{activeDeals.length === 0 && (
								<p className="text-sm text-muted-foreground">No active deals</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Recent Activity */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Activity className="h-4 w-4" />
							Recent Activity
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{recentActivities.map((activity) => {
								const Icon = ACTIVITY_ICONS[activity.type] || FileText;
								return (
									<div key={activity.id} className="flex items-start gap-3 rounded-lg border p-3">
										<div className="mt-0.5 rounded-md bg-muted p-1.5">
											<Icon className="h-3.5 w-3.5 text-muted-foreground" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm">{activity.summary}</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{activity.date || "No date"}
											</p>
										</div>
									</div>
								);
							})}
							{recentActivities.length === 0 && (
								<p className="text-sm text-muted-foreground">No recent activity</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Top Contacts by Lead Score */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Users className="h-4 w-4" />
						Top Leads by Score
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
						{topContacts.map((contact) => (
							<div key={contact.id} className="rounded-lg border p-3">
								<div className="flex items-center justify-between">
									<p className="truncate text-sm font-medium">{contact.name}</p>
									<span
										className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", {
											"bg-emerald-100 text-emerald-700": contact.leadScore >= 80,
											"bg-amber-100 text-amber-700":
												contact.leadScore >= 60 && contact.leadScore < 80,
											"bg-red-100 text-red-700": contact.leadScore < 60,
										})}
									>
										{contact.leadScore}
									</span>
								</div>
								<p className="mt-1 truncate text-xs text-muted-foreground">{contact.role}</p>
								<p className="truncate text-xs text-muted-foreground">{contact.company}</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
