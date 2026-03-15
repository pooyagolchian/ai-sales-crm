"use client";

import { Bot, Kanban, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ href: "/", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/pipeline", label: "Pipeline", icon: Kanban },
	{ href: "/leads", label: "Leads", icon: Users },
	{ href: "/assistant", label: "AI Assistant", icon: Bot },
] as const;

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
			{/* Logo */}
			<div className="flex h-14 items-center gap-2 border-b px-4">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
					AI
				</div>
				<span className="text-lg font-semibold">Sales CRM</span>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-1 p-3">
				{NAV_ITEMS.map((item) => {
					const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-sidebar-accent text-sidebar-accent-foreground"
									: "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			{/* Footer */}
			<div className="border-t p-3">
				<div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground">
					<span className="h-2 w-2 rounded-full bg-green-500" />
					Notion MCP Connected
				</div>
			</div>
		</aside>
	);
}
