"use client";

import {
	ArrowUpDown,
	Bot,
	ChevronDown,
	ChevronUp,
	Loader2,
	Mail,
	Plus,
	RefreshCw,
	Search,
	Sparkles,
	User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Contact, LeadScoreResult } from "@/types";
import { LEAD_SOURCES } from "@/types";

type SortField = "name" | "leadScore" | "company";
type SortDir = "asc" | "desc";

function scoreColor(score: number): string {
	if (score >= 80) return "bg-emerald-100 text-emerald-700";
	if (score >= 60) return "bg-amber-100 text-amber-700";
	return "bg-red-100 text-red-700";
}

export function LeadsClient() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filters
	const [search, setSearch] = useState("");
	const [sourceFilter, setSourceFilter] = useState<string>("all");

	// Sorting
	const [sortField, setSortField] = useState<SortField>("leadScore");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	// AI Scoring
	const [scoringId, setScoringId] = useState<string | null>(null);
	const [scoreResult, setScoreResult] = useState<Record<string, LeadScoreResult>>({});

	// Contact detail dialog
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

	// New contact dialog
	const [showNewContact, setShowNewContact] = useState(false);
	const [newContact, setNewContact] = useState({
		name: "",
		email: "",
		company: "",
		role: "",
		source: "",
	});
	const [creating, setCreating] = useState(false);

	const fetchContacts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/contacts");
			if (!res.ok) throw new Error("Failed to fetch contacts");
			const data = await res.json();
			setContacts(data.contacts ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load contacts");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchContacts();
	}, [fetchContacts]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir(field === "leadScore" ? "desc" : "asc");
		}
	};

	const filtered = useMemo(() => {
		let list = contacts;

		if (search) {
			const q = search.toLowerCase();
			list = list.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					c.email.toLowerCase().includes(q) ||
					c.company.toLowerCase().includes(q) ||
					c.role.toLowerCase().includes(q),
			);
		}

		if (sourceFilter !== "all") {
			list = list.filter((c) => c.source === sourceFilter);
		}

		list = [...list].sort((a, b) => {
			const dir = sortDir === "asc" ? 1 : -1;
			if (sortField === "leadScore") return (a.leadScore - b.leadScore) * dir;
			return a[sortField].localeCompare(b[sortField]) * dir;
		});

		return list;
	}, [contacts, search, sourceFilter, sortField, sortDir]);

	const handleScoreContact = async (contact: Contact) => {
		setScoringId(contact.id);
		try {
			const res = await fetch("/api/ai/score", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ contactId: contact.id }),
			});
			if (!res.ok) throw new Error("Scoring failed");
			const data = await res.json();
			setScoreResult((prev) => ({
				...prev,
				[contact.id]: data,
			}));
			// Update the contact's score in the list
			setContacts((prev) =>
				prev.map((c) =>
					c.id === contact.id ? { ...c, leadScore: data.score, leadScoreNotes: data.reasoning } : c,
				),
			);
			toast.success(`Scored ${contact.name}: ${data.score}/100`);
		} catch {
			toast.error(`Failed to score ${contact.name}`);
		} finally {
			setScoringId(null);
		}
	};

	const handleScoreAll = async () => {
		for (const contact of contacts) {
			await handleScoreContact(contact);
		}
	};

	const handleCreateContact = async () => {
		if (!newContact.name.trim()) {
			toast.error("Name is required");
			return;
		}
		setCreating(true);
		try {
			const res = await fetch("/api/contacts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newContact),
			});
			if (!res.ok) throw new Error("Failed to create contact");
			const data = await res.json();
			setContacts((prev) => [data.contact, ...prev]);
			setShowNewContact(false);
			setNewContact({ name: "", email: "", company: "", role: "", source: "" });
			toast.success(`Created contact: ${data.contact.name}`);
		} catch {
			toast.error("Failed to create contact");
		} finally {
			setCreating(false);
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field)
			return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
		return sortDir === "asc" ? (
			<ChevronUp className="ml-1 inline h-3 w-3" />
		) : (
			<ChevronDown className="ml-1 inline h-3 w-3" />
		);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">Loading contacts...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-20">
				<p className="text-destructive">{error}</p>
				<Button variant="outline" onClick={fetchContacts}>
					<RefreshCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			</div>
		);
	}

	return (
		<>
			{/* Toolbar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-2">
					<div className="relative flex-1 sm:max-w-xs">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search contacts..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "all")}>
						<SelectTrigger className="w-36">
							<SelectValue placeholder="Source" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Sources</SelectItem>
							{LEAD_SOURCES.map((s) => (
								<SelectItem key={s} value={s}>
									{s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={fetchContacts}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={handleScoreAll}
						disabled={scoringId !== null}
					>
						<Sparkles className="mr-2 h-4 w-4" />
						Score All
					</Button>
					<Button size="sm" onClick={() => setShowNewContact(true)}>
						<Plus className="mr-2 h-4 w-4" />
						New Contact
					</Button>
				</div>
			</div>

			{/* Contact count */}
			<p className="text-sm text-muted-foreground">
				{filtered.length} contact{filtered.length !== 1 ? "s" : ""}
				{search || sourceFilter !== "all" ? " (filtered)" : ""}
			</p>

			{/* Table */}
			<Card>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/50">
									<th className="px-4 py-3 text-left font-medium">
										<button
											type="button"
											onClick={() => handleSort("name")}
											className="inline-flex items-center hover:text-foreground"
										>
											Name
											<SortIcon field="name" />
										</button>
									</th>
									<th className="px-4 py-3 text-left font-medium">Email</th>
									<th className="px-4 py-3 text-left font-medium">
										<button
											type="button"
											onClick={() => handleSort("company")}
											className="inline-flex items-center hover:text-foreground"
										>
											Company
											<SortIcon field="company" />
										</button>
									</th>
									<th className="px-4 py-3 text-left font-medium">Role</th>
									<th className="px-4 py-3 text-left font-medium">Source</th>
									<th className="px-4 py-3 text-center font-medium">
										<button
											type="button"
											onClick={() => handleSort("leadScore")}
											className="inline-flex items-center hover:text-foreground"
										>
											Score
											<SortIcon field="leadScore" />
										</button>
									</th>
									<th className="px-4 py-3 text-center font-medium">AI</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((contact) => (
									<tr
										key={contact.id}
										className="cursor-pointer border-b transition-colors hover:bg-muted/30"
										onClick={() => setSelectedContact(contact)}
									>
										<td className="px-4 py-3 font-medium">{contact.name}</td>
										<td className="px-4 py-3 text-muted-foreground">{contact.email}</td>
										<td className="px-4 py-3">{contact.company}</td>
										<td className="px-4 py-3 text-muted-foreground">{contact.role}</td>
										<td className="px-4 py-3">
											{contact.source && (
												<Badge variant="outline" className="text-xs">
													{contact.source}
												</Badge>
											)}
										</td>
										<td className="px-4 py-3 text-center">
											<span
												className={cn(
													"inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
													scoreColor(contact.leadScore),
												)}
											>
												{contact.leadScore}
											</span>
										</td>
										<td className="px-4 py-3 text-center">
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												disabled={scoringId === contact.id}
												onClick={(e) => {
													e.stopPropagation();
													handleScoreContact(contact);
												}}
											>
												{scoringId === contact.id ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<Bot className="h-3.5 w-3.5" />
												)}
											</Button>
										</td>
									</tr>
								))}
								{filtered.length === 0 && (
									<tr>
										<td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
											No contacts found
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* New Contact Dialog */}
			<Dialog open={showNewContact} onOpenChange={setShowNewContact}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>New Contact</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label htmlFor="nc-name">Name *</Label>
							<Input
								id="nc-name"
								value={newContact.name}
								onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
							/>
						</div>
						<div>
							<Label htmlFor="nc-email">Email</Label>
							<Input
								id="nc-email"
								type="email"
								value={newContact.email}
								onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
							/>
						</div>
						<div>
							<Label htmlFor="nc-company">Company</Label>
							<Input
								id="nc-company"
								value={newContact.company}
								onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))}
							/>
						</div>
						<div>
							<Label htmlFor="nc-role">Role</Label>
							<Input
								id="nc-role"
								value={newContact.role}
								onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))}
							/>
						</div>
						<div>
							<Label>Source</Label>
							<Select
								value={newContact.source}
								onValueChange={(v) => setNewContact((p) => ({ ...p, source: v ?? "" }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select source" />
								</SelectTrigger>
								<SelectContent>
									{LEAD_SOURCES.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowNewContact(false)}>
							Cancel
						</Button>
						<Button onClick={handleCreateContact} disabled={creating}>
							{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Contact Detail Dialog */}
			<Dialog
				open={!!selectedContact}
				onOpenChange={(open) => {
					if (!open) setSelectedContact(null);
				}}
			>
				{selectedContact && (
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								{selectedContact.name}
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-4">
							{/* Contact Info */}
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="text-xs text-muted-foreground">Email</p>
									<p className="flex items-center gap-1 text-sm">
										<Mail className="h-3 w-3" />
										{selectedContact.email || "—"}
									</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Company</p>
									<p className="text-sm">{selectedContact.company || "—"}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Role</p>
									<p className="text-sm">{selectedContact.role || "—"}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Source</p>
									<p className="text-sm">{selectedContact.source || "—"}</p>
								</div>
							</div>

							{/* Lead Score */}
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="flex items-center justify-between text-sm">
										<span className="flex items-center gap-1.5">
											<Sparkles className="h-4 w-4" />
											Lead Score
										</span>
										<span
											className={cn(
												"rounded-full px-3 py-1 text-lg font-bold",
												scoreColor(selectedContact.leadScore),
											)}
										>
											{selectedContact.leadScore}
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									{selectedContact.leadScoreNotes || scoreResult[selectedContact.id] ? (
										<p className="text-sm text-muted-foreground">
											{scoreResult[selectedContact.id]?.reasoning || selectedContact.leadScoreNotes}
										</p>
									) : (
										<div className="flex items-center justify-between">
											<p className="text-sm text-muted-foreground">No AI analysis yet</p>
											<Button
												size="sm"
												variant="secondary"
												disabled={scoringId === selectedContact.id}
												onClick={() => handleScoreContact(selectedContact)}
											>
												{scoringId === selectedContact.id ? (
													<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
												) : (
													<Bot className="mr-2 h-3.5 w-3.5" />
												)}
												Score with AI
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</DialogContent>
				)}
			</Dialog>
		</>
	);
}
