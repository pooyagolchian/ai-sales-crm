"use client";

import { Bot, Loader2, Mail, Phone } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Deal, DealStage, GhostwriterResult, PreCallBriefing, Priority } from "@/types";
import { DEAL_STAGES, PRIORITIES } from "@/types";

interface DealDialogProps {
	deal: Deal | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (deal: Deal) => void;
}

export function DealDialog({ deal, open, onOpenChange, onSave }: DealDialogProps) {
	const [saving, setSaving] = useState(false);
	const [name, setName] = useState(deal?.name ?? "");
	const [stage, setStage] = useState<DealStage>(deal?.stage ?? "Lead");
	const [value, setValue] = useState(deal?.value?.toString() ?? "");
	const [priority, setPriority] = useState<Priority>(deal?.priority ?? "Medium");
	const [closeDate, setCloseDate] = useState(deal?.closeDate ?? "");
	const [nextAction, setNextAction] = useState(deal?.nextAction ?? "");

	// AI feature state
	const [briefing, setBriefing] = useState<PreCallBriefing | null>(null);
	const [briefingLoading, setBriefingLoading] = useState(false);
	const [ghostwriterResult, setGhostwriterResult] = useState<GhostwriterResult | null>(null);
	const [ghostwriterLoading, setGhostwriterLoading] = useState(false);
	const [emailType, setEmailType] = useState("follow-up");

	// Reset form when deal changes
	const resetForm = () => {
		setName(deal?.name ?? "");
		setStage(deal?.stage ?? "Lead");
		setValue(deal?.value?.toString() ?? "");
		setPriority(deal?.priority ?? "Medium");
		setCloseDate(deal?.closeDate ?? "");
		setNextAction(deal?.nextAction ?? "");
		setBriefing(null);
		setGhostwriterResult(null);
	};

	const handleGenerateBriefing = async () => {
		if (!deal?.id) return;
		setBriefingLoading(true);
		try {
			const res = await fetch("/api/ai/briefing", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ dealId: deal.id }),
			});
			if (!res.ok) throw new Error("Failed to generate briefing");
			const data = await res.json();
			setBriefing(data);
		} catch {
			// User sees the button stops spinning
		} finally {
			setBriefingLoading(false);
		}
	};

	const handleGhostwrite = async () => {
		if (!deal?.id) return;
		setGhostwriterLoading(true);
		try {
			const res = await fetch("/api/ai/ghostwriter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ dealId: deal.id, emailType }),
			});
			if (!res.ok) throw new Error("Failed to generate email");
			const data = await res.json();
			setGhostwriterResult(data);
		} catch {
			// User sees the button stops spinning
		} finally {
			setGhostwriterLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setSaving(true);
		try {
			const payload = {
				name: name.trim(),
				stage,
				value: value ? Number.parseFloat(value) : 0,
				priority,
				closeDate: closeDate || undefined,
				nextAction: nextAction.trim() || undefined,
			};

			const isNew = !deal?.id;
			const url = isNew ? "/api/deals" : `/api/deals/${deal.id}`;
			const method = isNew ? "POST" : "PATCH";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				throw new Error("Failed to save deal");
			}

			const data = await res.json();
			onSave(data.deal);
			onOpenChange(false);
		} catch {
			// Error handling via toast would go here
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) resetForm();
				onOpenChange(isOpen);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{deal?.id ? "Edit Deal" : "New Deal"}</DialogTitle>
				</DialogHeader>

				{deal?.id ? (
					<Tabs defaultValue="details">
						<TabsList className="w-full">
							<TabsTrigger value="details" className="flex-1">
								Details
							</TabsTrigger>
							<TabsTrigger value="briefing" className="flex-1">
								<Phone className="mr-1.5 h-3.5 w-3.5" />
								Briefing
							</TabsTrigger>
							<TabsTrigger value="email" className="flex-1">
								<Mail className="mr-1.5 h-3.5 w-3.5" />
								Email
							</TabsTrigger>
						</TabsList>

						<TabsContent value="details">
							<form onSubmit={handleSubmit} className="space-y-4">
								{dealFormFields()}
								{dealFormActions()}
							</form>
						</TabsContent>

						<TabsContent value="briefing">
							<div className="space-y-3">
								<Button
									onClick={handleGenerateBriefing}
									disabled={briefingLoading}
									className="w-full"
									variant="secondary"
								>
									{briefingLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Bot className="mr-2 h-4 w-4" />
									)}
									Generate Pre-Call Briefing
								</Button>
								{briefing && (
									<ScrollArea className="h-80">
										<div className="space-y-3 pr-3">
											<BriefingSection title="Contact" content={briefing.contactSummary} />
											<BriefingSection title="Deal Context" content={briefing.dealContext} />
											<BriefingSection title="Talking Points">
												<ul className="list-disc pl-4 text-sm text-muted-foreground">
													{briefing.talkingPoints.map((p) => (
														<li key={p}>{p}</li>
													))}
												</ul>
											</BriefingSection>
											{briefing.knownObjections.length > 0 && (
												<BriefingSection title="Potential Objections">
													<ul className="list-disc pl-4 text-sm text-muted-foreground">
														{briefing.knownObjections.map((o) => (
															<li key={o}>{o}</li>
														))}
													</ul>
												</BriefingSection>
											)}
											<BriefingSection title="History" content={briefing.relationshipHistory} />
											<BriefingSection
												title="Suggested Approach"
												content={briefing.suggestedApproach}
											/>
										</div>
									</ScrollArea>
								)}
							</div>
						</TabsContent>

						<TabsContent value="email">
							<div className="space-y-3">
								<div className="flex gap-2">
									<Select value={emailType} onValueChange={(v) => setEmailType(v ?? "follow-up")}>
										<SelectTrigger className="flex-1">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="follow-up">Follow-up</SelectItem>
											<SelectItem value="introduction">Introduction</SelectItem>
											<SelectItem value="proposal">Proposal</SelectItem>
											<SelectItem value="check-in">Check-in</SelectItem>
											<SelectItem value="closing">Closing</SelectItem>
										</SelectContent>
									</Select>
									<Button
										onClick={handleGhostwrite}
										disabled={ghostwriterLoading}
										variant="secondary"
									>
										{ghostwriterLoading ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Bot className="mr-2 h-4 w-4" />
										)}
										Draft
									</Button>
								</div>
								{ghostwriterResult && (
									<Card>
										<CardContent className="pt-4">
											<p className="mb-2 text-xs text-muted-foreground">
												To: {ghostwriterResult.contactName}
											</p>
											<div className="text-sm leading-relaxed">
												<Markdown
													components={{
														p: ({ children }) => <p className="my-1.5">{children}</p>,
														strong: ({ children }) => (
															<strong className="font-semibold">{children}</strong>
														),
														ul: ({ children }) => (
															<ul className="my-1.5 list-disc space-y-0.5 pl-5">
																{children}
															</ul>
														),
														ol: ({ children }) => (
															<ol className="my-1.5 list-decimal space-y-0.5 pl-5">
																{children}
															</ol>
														),
													}}
												>
													{ghostwriterResult.emailDraft}
												</Markdown>
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						</TabsContent>
					</Tabs>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						{dealFormFields()}
						{dealFormActions()}
					</form>
				)}
			</DialogContent>
		</Dialog>
	);

	function dealFormFields() {
		return (
			<>
				<div className="space-y-2">
					<Label htmlFor="deal-name">Deal Name</Label>
					<Input
						id="deal-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Acme Corp Enterprise Plan"
						required
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="deal-stage">Stage</Label>
						<Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
							<SelectTrigger id="deal-stage">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{DEAL_STAGES.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="deal-priority">Priority</Label>
						<Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
							<SelectTrigger id="deal-priority">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PRIORITIES.map((p) => (
									<SelectItem key={p} value={p}>
										{p}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="deal-value">Value ($)</Label>
						<Input
							id="deal-value"
							type="number"
							min="0"
							step="100"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="50000"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="deal-close-date">Close Date</Label>
						<Input
							id="deal-close-date"
							type="date"
							value={closeDate}
							onChange={(e) => setCloseDate(e.target.value)}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="deal-next-action">Next Action</Label>
					<Textarea
						id="deal-next-action"
						value={nextAction}
						onChange={(e) => setNextAction(e.target.value)}
						placeholder="Schedule demo with CTO"
						rows={2}
					/>
				</div>
			</>
		);
	}

	function dealFormActions() {
		return (
			<div className="flex justify-end gap-2 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => onOpenChange(false)}
					disabled={saving}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={saving || !name.trim()}>
					{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{deal?.id ? "Update" : "Create"} Deal
				</Button>
			</div>
		);
	}
}

function BriefingSection({
	title,
	content,
	children,
}: {
	title: string;
	content?: string;
	children?: React.ReactNode;
}) {
	return (
		<div>
			<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
			{content && <p className="mt-1 text-sm">{content}</p>}
			{children && <div className="mt-1">{children}</div>}
		</div>
	);
}
