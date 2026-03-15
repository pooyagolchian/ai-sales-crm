"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Deal, Priority } from "@/types";
import { Calendar, DollarSign, Loader2 } from "lucide-react";

interface DealCardProps {
	deal: Deal;
	isDragging?: boolean;
	isUpdating?: boolean;
	onClick?: () => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
	Low: "bg-gray-100 text-gray-700",
	Medium: "bg-yellow-100 text-yellow-700",
	High: "bg-red-100 text-red-700",
};

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function DealCard({ deal, isDragging, isUpdating, onClick }: DealCardProps) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: deal.id,
	});

	const style = transform
		? { transform: `translate(${transform.x}px, ${transform.y}px)` }
		: undefined;

	return (
		<Card
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			style={style}
			onClick={onClick}
			className={cn(
				"cursor-grab active:cursor-grabbing transition-shadow",
				isDragging && "shadow-lg opacity-80 rotate-2",
				isUpdating && "opacity-60",
			)}
		>
			<CardContent className="p-3 space-y-2">
				<div className="flex items-start justify-between gap-2">
					<h4 className="text-sm font-medium leading-tight">{deal.name}</h4>
					{isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
				</div>

				{deal.contactName && (
					<p className="text-xs text-muted-foreground">{deal.contactName}</p>
				)}

				<div className="flex items-center gap-2 flex-wrap">
					{deal.value > 0 && (
						<span className="flex items-center gap-1 text-xs font-medium text-green-700">
							<DollarSign className="h-3 w-3" />
							{formatCurrency(deal.value)}
						</span>
					)}

					{deal.priority && (
						<Badge variant="secondary" className={cn("text-xs", PRIORITY_COLORS[deal.priority])}>
							{deal.priority}
						</Badge>
					)}
				</div>

				{deal.closeDate && (
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<Calendar className="h-3 w-3" />
						{new Date(deal.closeDate).toLocaleDateString()}
					</div>
				)}

				{deal.nextAction && (
					<p className="text-xs text-muted-foreground truncate">→ {deal.nextAction}</p>
				)}
			</CardContent>
		</Card>
	);
}
