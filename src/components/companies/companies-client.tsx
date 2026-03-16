"use client";

import { Building2, ExternalLink, Globe, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Company } from "@/types";

const SIZE_COLORS: Record<string, string> = {
	Enterprise: "bg-violet-100 text-violet-700",
	"Mid-Market": "bg-blue-100 text-blue-700",
	SMB: "bg-emerald-100 text-emerald-700",
	Startup: "bg-amber-100 text-amber-700",
};

const INDUSTRY_COLORS: Record<string, string> = {
	Technology: "bg-blue-100 text-blue-700",
	Healthcare: "bg-emerald-100 text-emerald-700",
	Finance: "bg-amber-100 text-amber-700",
	Education: "bg-violet-100 text-violet-700",
	Manufacturing: "bg-slate-100 text-slate-700",
	Logistics: "bg-orange-100 text-orange-700",
	Agriculture: "bg-green-100 text-green-700",
};

export function CompaniesClient() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const fetchCompanies = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/companies");
			if (!res.ok) throw new Error("Failed to fetch companies");
			const data = await res.json();
			setCompanies(data.companies ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load companies");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchCompanies();
	}, [fetchCompanies]);

	const filtered = useMemo(() => {
		if (!search) return companies;
		const q = search.toLowerCase();
		return companies.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.industry.toLowerCase().includes(q) ||
				c.size.toLowerCase().includes(q),
		);
	}, [companies, search]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				<span className="ml-2 text-muted-foreground">Loading companies...</span>
			</div>
		);
	}

	if (error) {
		return (
			<Card className="border-destructive">
				<CardContent className="pt-6">
					<p className="text-sm text-destructive">{error}</p>
					<Button variant="outline" size="sm" className="mt-2" onClick={fetchCompanies}>
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-xs">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search companies..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>
				<Button variant="outline" size="sm" onClick={fetchCompanies}>
					<RefreshCw className="mr-1 h-3.5 w-3.5" />
					Refresh
				</Button>
			</div>

			<p className="text-sm text-muted-foreground">{filtered.length} companies</p>

			{/* Company Cards Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{filtered.map((company) => (
					<Card key={company.id} className="transition-shadow hover:shadow-md">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-base">
								<Building2 className="h-4 w-4 text-muted-foreground" />
								{company.name}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{company.industry && (
									<Badge
										variant="secondary"
										className={cn("text-xs", INDUSTRY_COLORS[company.industry] ?? "")}
									>
										{company.industry}
									</Badge>
								)}
								{company.size && (
									<Badge
										variant="secondary"
										className={cn("text-xs", SIZE_COLORS[company.size] ?? "")}
									>
										{company.size}
									</Badge>
								)}
							</div>
							{company.website && (
								<a
									href={company.website}
									target="_blank"
									rel="noopener noreferrer"
									className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									<Globe className="h-3 w-3" />
									<span className="truncate">{company.website.replace(/^https?:\/\//, "")}</span>
									<ExternalLink className="h-3 w-3 flex-shrink-0" />
								</a>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{filtered.length === 0 && !loading && (
				<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
					<Users className="h-8 w-8 mb-2" />
					<p className="text-sm">No companies found</p>
				</div>
			)}
		</div>
	);
}
