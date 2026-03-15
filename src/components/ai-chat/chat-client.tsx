"use client";

import { Bot, Loader2, Send, User } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const SUGGESTED_PROMPTS = [
	"Show me all deals in the Proposal stage",
	"What's the total pipeline value?",
	"Which leads have the highest scores?",
	"Summarize recent activity across all deals",
	"Create a follow-up task for our largest deal",
];

export function ChatClient() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const scrollToBottom = useCallback(() => {
		setTimeout(() => {
			scrollRef.current?.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth",
			});
		}, 50);
	}, []);

	const sendMessage = async (text: string) => {
		if (!text.trim() || loading) return;

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: text.trim(),
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);
		scrollToBottom();

		try {
			const res = await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: text.trim(),
					history: messages.slice(-10),
				}),
			});

			if (!res.ok) {
				throw new Error("Failed to get response");
			}

			const data = await res.json();

			const assistantMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: data.response,
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch {
			const errorMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content:
					"Sorry, I encountered an error. Please make sure the MCP server is running and try again.",
				timestamp: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setLoading(false);
			scrollToBottom();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	return (
		<div className="flex h-[calc(100vh-10rem)] flex-col">
			{/* Messages Area */}
			<Card className="flex-1 overflow-hidden">
				<ScrollArea className="h-full p-4" ref={scrollRef}>
					{messages.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center gap-6 py-12">
							<div className="rounded-full bg-primary/10 p-4">
								<Bot className="h-8 w-8 text-primary" />
							</div>
							<div className="text-center">
								<h3 className="font-display text-lg font-semibold">AI Sales Assistant</h3>
								<p className="mt-1 max-w-sm text-sm text-muted-foreground">
									Ask me anything about your CRM data. I can query deals, contacts, activities and
									even create or update records.
								</p>
							</div>
							<div className="flex flex-wrap justify-center gap-2">
								{SUGGESTED_PROMPTS.map((prompt) => (
									<Button
										key={prompt}
										variant="outline"
										size="sm"
										className="text-xs"
										onClick={() => sendMessage(prompt)}
									>
										{prompt}
									</Button>
								))}
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{messages.map((msg) => (
								<div
									key={msg.id}
									className={cn(
										"flex gap-3",
										msg.role === "user" ? "justify-end" : "justify-start",
									)}
								>
									{msg.role === "assistant" && (
										<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
											<Bot className="h-4 w-4 text-primary" />
										</div>
									)}
									<div
										className={cn(
											"max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
											msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
										)}
									>
										<div className="whitespace-pre-wrap">{msg.content}</div>
									</div>
									{msg.role === "user" && (
										<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
											<User className="h-4 w-4" />
										</div>
									)}
								</div>
							))}
							{loading && (
								<div className="flex gap-3">
									<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<Bot className="h-4 w-4 text-primary" />
									</div>
									<div className="rounded-lg bg-muted px-4 py-2.5">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								</div>
							)}
						</div>
					)}
				</ScrollArea>
			</Card>

			{/* Input Area */}
			<div className="mt-3 flex gap-2">
				<Textarea
					ref={textareaRef}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask about your deals, contacts, or pipeline..."
					className="min-h-11 resize-none"
					rows={1}
					disabled={loading}
				/>
				<Button
					size="icon"
					onClick={() => sendMessage(input)}
					disabled={!input.trim() || loading}
					className="shrink-0"
				>
					{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
				</Button>
			</div>
		</div>
	);
}
