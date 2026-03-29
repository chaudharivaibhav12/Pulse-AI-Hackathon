"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };
type OrchestratorReply = { intent?: string; response?: string; action?: string };

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      let displayText = data.reply;

      // Try to parse orchestrator JSON response
      try {
        const parsed: OrchestratorReply = JSON.parse(data.reply);
        if (parsed.response) displayText = parsed.response;
      } catch {
        // Not JSON — use raw reply
      }

      setMessages((prev) => [...prev, { role: "assistant", content: displayText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { label: "Nutrition", icon: "🥗", href: "/nutrition" },
    { label: "Exercise", icon: "🏃", href: "/exercise" },
    { label: "Check-In", icon: "💬", href: "/copilot" },
    { label: "Buddies", icon: "🤝", href: "/buddy" },
    { label: "SOS", icon: "❤️", href: "/sos", danger: true },
    { label: "Progress", icon: "🏆", href: "/progress" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">❤️</span>
          <span className="text-2xl font-bold text-[#2563EB]">Pulse AI</span>
        </div>
        <button className="text-xl font-bold text-gray-500">A</button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-8">
        {/* Welcome */}
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Good Morning, Maria 👋
        </h1>
        <p className="text-xl text-gray-500 mb-8">How are you feeling today?</p>

        {/* Progress Card */}
        <div className="bg-white rounded-3xl shadow p-6 mb-8">
          <p className="text-lg font-semibold text-gray-600 mb-1">Your Rehab Progress</p>
          <p className="text-3xl font-bold text-[#2563EB] mb-3">
            8 of 36 sessions complete — Week 3 of 12
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-[#2563EB] h-4 rounded-full transition-all"
              style={{ width: `${(8 / 36) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">{Math.round((8 / 36) * 100)}% complete — keep going! 💪</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-2 rounded-3xl shadow p-6 text-center transition-transform active:scale-95 ${
                item.danger
                  ? "bg-[#DC2626] text-white"
                  : "bg-white text-gray-800 hover:bg-blue-50"
              }`}
            >
              <span className="text-4xl">{item.icon}</span>
              <span className="text-xl font-semibold">{item.label}</span>
            </a>
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 px-4">
        <a href="/" className="flex flex-col items-center text-[#2563EB]">
          <span className="text-2xl">🏠</span>
          <span className="text-xs font-medium">Home</span>
        </a>
        <a href="/copilot" className="flex flex-col items-center text-gray-500">
          <span className="text-2xl">💬</span>
          <span className="text-xs font-medium">Check-In</span>
        </a>
        <a href="/sos" className="flex flex-col items-center text-[#DC2626]">
          <span className="text-2xl">🚨</span>
          <span className="text-xs font-bold">SOS</span>
        </a>
        <a href="/progress" className="flex flex-col items-center text-gray-500">
          <span className="text-2xl">📈</span>
          <span className="text-xs font-medium">Progress</span>
        </a>
        <a href="/care" className="flex flex-col items-center text-gray-500">
          <span className="text-2xl">🩺</span>
          <span className="text-xs font-medium">Care</span>
        </a>
      </nav>

      {/* Floating Chat Bubble */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-24 right-6 w-16 h-16 bg-[#2563EB] text-white rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-blue-700 transition"
          aria-label="Open AI Co-Pilot"
        >
          🤖
        </button>
      )}

      {/* Chat Drawer */}
      {chatOpen && (
        <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-96 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 max-h-[70vh]">
          {/* Chat Header */}
          <div className="bg-[#2563EB] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-bold text-lg">Pulse AI Co-Pilot</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white text-2xl leading-none">
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="bg-blue-50 rounded-2xl px-4 py-3 text-lg text-gray-700">
                Hi Maria! 👋 How can I help you today? I can help with nutrition, exercise, your progress, or connect you with your buddies.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-2xl px-4 py-3 text-lg max-w-[85%] ${
                  m.role === "user"
                    ? "bg-[#2563EB] text-white ml-auto"
                    : "bg-blue-50 text-gray-800"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-blue-50 rounded-2xl px-4 py-3 text-lg text-gray-500 flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-[#2563EB] text-white rounded-2xl px-5 py-3 text-lg font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
