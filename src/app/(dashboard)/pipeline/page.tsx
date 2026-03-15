import { PipelineClient } from "@/components/kanban/pipeline-client";
import { PageHeader } from "@/components/shared/page-header";

export default function PipelinePage() {
	return (
		<div className="space-y-6">
			<PageHeader title="Pipeline" description="Drag deals between stages to update their status" />
			<PipelineClient />
		</div>
	);
}
