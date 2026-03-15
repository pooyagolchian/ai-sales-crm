import { AppSidebar } from "@/components/shared/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<div className="flex h-screen overflow-hidden">
				<AppSidebar />
				<main className="flex-1 overflow-y-auto pt-14 md:pt-0">
					<div className="p-6">{children}</div>
				</main>
			</div>
		</TooltipProvider>
	);
}
