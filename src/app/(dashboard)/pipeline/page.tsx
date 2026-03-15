import { PipelineClient } from "@/components/kanban/pipeline-client";
import { PageHeader } from "@/components/shared/page-header";

export default function PipelinePage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Deal Pipeline"
				description="Visual revenue pipeline — drag deals between stages to track your sales team's progress"
			/>
			<PipelineClient />
		</div>
	);
}
