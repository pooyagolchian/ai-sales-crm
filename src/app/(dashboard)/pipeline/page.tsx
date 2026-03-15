import { PageHeader } from "@/components/shared/page-header";

export default function PipelinePage() {
	return (
		<div className="space-y-6">
			<PageHeader title="Pipeline" description="Drag deals between stages to update their status" />

			<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
				<p className="text-lg font-medium">Kanban Board</p>
				<p className="text-sm">Pipeline board with drag-and-drop will be implemented in Phase 2</p>
			</div>
		</div>
	);
}
