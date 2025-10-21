import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import "./ChatboxAI.css";

type Role = "user" | "assistant" | "system";

export type ChatMessage = {
	id: string;
	role: Role;
	content: string;
	createdAt: number;
};

type ChatboxAIProps = {
	title?: string;
	placeholder?: string;
	initialOpen?: boolean;
	// Optional ask function; returns assistant reply text
	onAsk?: (prompt: string, history: ChatMessage[]) => Promise<string>;
	// Optional: start with predefined messages
	initialMessages?: ChatMessage[];
};

const defaultWelcome: ChatMessage = {
	id: crypto.randomUUID(),
	role: "assistant",
	content: "Hi there! How can I help you with your Grande Hotel plans today?",
	createdAt: Date.now(),
};

export default function ChatboxAI({
	title = "Ask AI",
	placeholder = "Ask anything…",
	initialOpen = false,
	onAsk,
	initialMessages,
}: ChatboxAIProps) {
	const [open, setOpen] = useState(initialOpen);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>(
		() => initialMessages && initialMessages.length > 0 ? initialMessages : [defaultWelcome]
	);

	const listRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const isDisabled = loading || input.trim().length === 0;

	useEffect(() => {
		if (!open) return;
		const el = listRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [open, messages]);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

		// Removed hint text row to keep input and send inline

	const handleSend = async () => {
		const text = input.trim();
		if (!text || loading) return;
		const userMsg: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: text,
			createdAt: Date.now(),
		};
		setMessages((m) => [...m, userMsg]);
		setInput("");
		setLoading(true);

		try {
			let reply = "";
			if (onAsk) {
				reply = await onAsk(text, [...messages, userMsg]);
			} else {
				// Fallback: simple echo-style reply
				reply = `You asked: "${text}"\n\nI can help with room types, pricing, availability, and booking tips.`;
				await new Promise((r) => setTimeout(r, 500));
			}
			const botMsg: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: reply,
				createdAt: Date.now(),
			};
			setMessages((m) => [...m, botMsg]);
		} catch (e) {
			const errMsg: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: "Sorry, I couldn't process that. Please try again.",
				createdAt: Date.now(),
			};
			setMessages((m) => [...m, errMsg]);
		} finally {
			setLoading(false);
		}
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const copyText = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {}
	};

	return (
		<div className="chatbox-root" aria-live="polite">
					{!open && (
						<button
							className="chatbox-button"
							aria-label="Open chat"
							onClick={() => setOpen(true)}
							title={title}
						>
							<span className="chatbox-button-icon" aria-hidden>💬</span>
						</button>
					)}

			{open && (
				<section className="chatbox-panel" role="dialog" aria-modal="false">
					<header className="chatbox-header">
						<div className="chatbox-title">{title}</div>
						<div className="chatbox-actions">
							<button
								className="chatbox-action"
								onClick={() => setOpen(false)}
								aria-label="Close chat"
							>
								✕
							</button>
						</div>
					</header>

					<div className="chatbox-messages" ref={listRef}>
						{messages.map((m) => (
							<article key={m.id} className={`msg msg-${m.role}`}>
								<div className="msg-meta">
									<span className="msg-role">{m.role === "user" ? "You" : "Assistant"}</span>
								</div>
												<div className="msg-content">
													{m.role === "assistant" ? (
														// Safely render assistant HTML (if present). Always sanitize first.
														<div
															className="msg-html"
															dangerouslySetInnerHTML={{
																__html: DOMPurify.sanitize(m.content, { USE_PROFILES: { html: true } }),
															}}
														/>
													) : (
														m.content.split("\n").map((line, i) => <p key={i}>{line}</p>)
													)}
												</div>
								{m.role === "assistant" && (
									<button
										className="msg-copy"
										onClick={() => copyText(m.content)}
										aria-label="Copy message"
										title="Copy"
									>
										Copy
									</button>
								)}
							</article>
						))}
						{loading && (
							<div className="msg msg-assistant">
								<div className="msg-content">
									<span className="dots" aria-hidden>●●●</span>
									<span className="sr-only">Assistant is typing</span>
								</div>
							</div>
						)}
					</div>

								<footer className="chatbox-input">
									<div className="chatbox-input-inline">
										<textarea
											ref={inputRef}
											value={input}
											onChange={(e) => setInput(e.target.value)}
											onKeyDown={onKeyDown}
											placeholder={placeholder}
											rows={2}
											aria-label="Message input"
										/>
										<button
											className="send"
											onClick={handleSend}
											disabled={isDisabled}
											aria-label="Send message"
											title="Send"
										>
											➤
										</button>
									</div>
								</footer>
				</section>
			)}
		</div>
	);
}

