"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DealDialog } from "@/components/kanban/deal-dialog";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import type { Deal } from "@/types";

export function PipelineClient() {
	const [deals, setDeals] = useState<Deal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const fetchDeals = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/deals");
			if (!res.ok) throw new Error("Failed to fetch deals");
			const data = await res.json();
			setDeals(data.deals ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load deals");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDeals();
	}, [fetchDeals]);

	const handleDealClick = (deal: Deal) => {
		setSelectedDeal(deal);
		setDialogOpen(true);
	};

	const handleNewDeal = () => {
		setSelectedDeal(null);
		setDialogOpen(true);
	};

	const handleSave = (savedDeal: Deal) => {
		setDeals((prev) => {
			const exists = prev.find((d) => d.id === savedDeal.id);
			if (exists) {
				return prev.map((d) => (d.id === savedDeal.id ? savedDeal : d));
			}
			return [...prev, savedDeal];
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">Loading pipeline...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-20">
				<p className="text-destructive">{error}</p>
				<p className="text-sm text-muted-foreground">
					Make sure the MCP server is running: <code>npm run mcp</code>
				</p>
				<Button variant="outline" onClick={fetchDeals}>
					<RefreshCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className="mb-4 flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{deals.length} deal{deals.length !== 1 ? "s" : ""} in pipeline
				</p>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={fetchDeals}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
					<Button size="sm" onClick={handleNewDeal}>
						<Plus className="mr-2 h-4 w-4" />
						New Deal
					</Button>
				</div>
			</div>

			<KanbanBoard initialDeals={deals} onDealClick={handleDealClick} />

			<DealDialog
				deal={selectedDeal}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSave={handleSave}
			/>
		</>
	);
}
