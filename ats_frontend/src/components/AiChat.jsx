import { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export default function AiChat() {

	const user = useSelector((s) => s.auth.user);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

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
		<div className="w-full max-w-xl mx-auto p-4 border rounded-md bg-white">
			<div className="font-semibold mb-2">AI Chat</div>
			<div className="h-64 overflow-y-auto border rounded p-2 mb-3 bg-gray-50">
				{messages.length === 0 && (
					<div className="text-sm text-gray-500">Ask about candidates, requirements (e.g., "show candidates in final round for R-123").</div>
				)}
				{messages.map((m, i) => (
					<div key={i} className={`text-sm my-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
						<span className="inline-block px-2 py-1 rounded bg-white border">{m.content}</span>
					</div>
				))}
			</div>
			<form onSubmit={sendMessage} className="flex gap-2">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					className="flex-1 border rounded px-2 py-1"
				/>
				<button disabled={loading || !user} className="px-3 py-1 border rounded bg-blue-600 text-white disabled:opacity-50">
					{loading ? "Sending..." : "Send"}
				</button>
			</form>
			{!user && <div className="text-xs text-red-600 mt-2">Please log in to use AI Chat.</div>}
			{error && <div className="text-xs text-red-600 mt-2">{error}</div>}
		</div>
	);
}


