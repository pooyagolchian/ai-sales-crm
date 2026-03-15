"use client";

import { useCallback, useState } from "react";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import type { Deal, DealStage } from "@/types";
import { DEAL_STAGES } from "@/types";

interface KanbanBoardProps {
	initialDeals: Deal[];
	onDealClick: (deal: Deal) => void;
}

const STAGE_COLORS: Record<DealStage, string> = {
	Lead: "bg-gray-100 border-gray-300",
	Qualified: "bg-blue-50 border-blue-300",
	Proposal: "bg-purple-50 border-purple-300",
	Negotiation: "bg-yellow-50 border-yellow-300",
	"Closed Won": "bg-green-50 border-green-300",
	"Closed Lost": "bg-red-50 border-red-300",
};

export function KanbanBoard({ initialDeals, onDealClick }: KanbanBoardProps) {
	const [deals, setDeals] = useState<Deal[]>(initialDeals);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [updating, setUpdating] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
	);

	const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

	const dealsByStage = DEAL_STAGES.reduce(
		(acc, stage) => {
			acc[stage] = deals.filter((d) => d.stage === stage);
			return acc;
		},
		{} as Record<DealStage, Deal[]>,
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	}, []);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			setActiveId(null);
			const { active, over } = event;

			if (!over) return;

			const dealId = active.id as string;
			const newStage = over.id as DealStage;

			const deal = deals.find((d) => d.id === dealId);
			if (!deal || deal.stage === newStage) return;

			// Optimistic update
			setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));

			setUpdating(dealId);
			try {
				const res = await fetch(`/api/deals/${dealId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ stage: newStage }),
				});

				if (!res.ok) {
					// Revert on failure
					setDeals((prev) =>
						prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d)),
					);
				}
			} catch {
				// Revert on error
				setDeals((prev) =>
					prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d)),
				);
			} finally {
				setUpdating(null);
			}
		},
		[deals],
	);

	return (
		<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="flex gap-4 overflow-x-auto pb-4">
				{DEAL_STAGES.map((stage) => (
					<KanbanColumn
						key={stage}
						stage={stage}
						deals={dealsByStage[stage]}
						colorClass={STAGE_COLORS[stage]}
						onDealClick={onDealClick}
						updatingId={updating}
					/>
				))}
			</div>

			<DragOverlay>
				{activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
			</DragOverlay>
		</DndContext>
	);
}
