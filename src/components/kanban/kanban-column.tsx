"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Deal, DealStage } from "@/types";
import { DealCard } from "./deal-card";

interface KanbanColumnProps {
	stage: DealStage;
	deals: Deal[];
	colorClass: string;
	onDealClick: (deal: Deal) => void;
	updatingId: string | null;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function KanbanColumn({
	stage,
	deals,
	colorClass,
	onDealClick,
	updatingId,
}: KanbanColumnProps) {
	const { isOver, setNodeRef } = useDroppable({ id: stage });
	const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"flex w-72 min-w-72 flex-col rounded-lg border-2 border-dashed p-3 transition-colors",
				colorClass,
				isOver && "border-primary bg-primary/5",
			)}
		>
			{/* Column Header */}
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h3 className="text-sm font-semibold">{stage}</h3>
					<Badge variant="secondary" className="text-xs">
						{deals.length}
					</Badge>
				</div>
				{totalValue > 0 && (
					<span className="text-xs font-medium text-muted-foreground">
						{formatCurrency(totalValue)}
					</span>
				)}
			</div>

			{/* Deal Cards */}
			<div className="flex flex-1 flex-col gap-2">
				{deals.map((deal) => (
					<DealCard
						key={deal.id}
						deal={deal}
						onClick={() => onDealClick(deal)}
						isUpdating={updatingId === deal.id}
					/>
				))}

				{deals.length === 0 && (
					<div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-4 text-xs text-muted-foreground">
						Drop deals here
					</div>
				)}
			</div>
		</div>
	);
}
