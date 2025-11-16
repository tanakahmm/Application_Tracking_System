import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export default function FloatingAiChat() {
	const user = useSelector((s) => s.auth.user);
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const messagesEndRef = useRef(null);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages, loading]);

	// Only show if user is logged in
	if (!user) return null;

	async function sendMessage(e) {
		e?.preventDefault?.();
		setError(null);
		const content = input.trim();
		if (!content) return;
		const next = [...messages, { role: "user", content }];
		setMessages(next);
		setInput("");
		setLoading(true);
		try {
			const res = await axios.post(`${API_URL}/api/ai/chat`, { message: content, user }, {
				headers: { "Content-Type": "application/json" },
			});
			const answer = res?.data?.answer || "No response";
			setMessages([...next, { role: "assistant", content: answer }]);
		} catch (err) {
			setError(err?.response?.data?.answer || err?.message || "Request failed");
			setMessages([...next, { role: "assistant", content: "AI request failed." }]);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			{/* Floating Chat Button - Bottom Right */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
				aria-label="Open AI Chat"
			>
				{isOpen ? (
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				) : (
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
					</svg>
				)}
			</button>

			{/* Chat Modal/Overlay */}
			{isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-end justify-end p-4 md:p-6" onClick={() => setIsOpen(false)}>
					<div
						className="bg-white rounded-t-lg md:rounded-lg shadow-2xl w-full md:w-96 h-[600px] md:h-[700px] flex flex-col z-50"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
							<div className="flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
								<span className="font-semibold">AI Assistant</span>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="text-white hover:text-gray-200 transition"
								aria-label="Close chat"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Messages Area */}
						<div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
							{messages.length === 0 && (
								<div className="text-center text-gray-500 mt-8">
									<div className="mb-2">
										<svg className="w-12 h-12 mx-auto text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
										</svg>
									</div>
									<p className="text-sm">Ask me anything about candidates, requirements, or clients!</p>
									<p className="text-xs mt-1 text-gray-400">Example: "Show candidates in final round for R-123"</p>
								</div>
							)}
							{messages.map((m, i) => (
								<div
									key={i}
									className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-[80%] rounded-lg px-4 py-2 ${
											m.role === "user"
												? "bg-indigo-600 text-white"
												: "bg-white text-gray-800 border border-gray-200"
										}`}
									>
										<p className="text-sm whitespace-pre-wrap">{m.content}</p>
									</div>
								</div>
							))}
							{loading && (
								<div className="flex justify-start">
									<div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
											<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Input Area */}
						<div className="border-t bg-white p-4">
							{error && (
								<div className="text-xs text-red-600 mb-2 bg-red-50 p-2 rounded">{error}</div>
							)}
							<form onSubmit={sendMessage} className="flex gap-2">
								<input
									type="text"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Type your message..."
									className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
									disabled={loading}
								/>
								<button
									type="submit"
									disabled={loading || !input.trim()}
									className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
								>
									{loading ? (
										<svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									) : (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
										</svg>
									)}
								</button>
							</form>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

