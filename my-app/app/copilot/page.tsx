"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"
import { TypingIndicator } from "@/components/pulse/typing-indicator"

interface Message {
  id: string
  role: "user" | "ai"
  text: string
}

const initialMessages: Message[] = [
  {
    id: "0",
    role: "ai",
    text: "Hi Maria! 💙 How are you feeling today? I'm here to listen — whether it's about your walk, your mood, or just a check-in. You can talk to me like a friend.",
  },
]

const aiReplies: Record<string, string> = {
  walk: "That's wonderful, Maria! Completing your walk is a big deal — your heart thanks you. How did it feel during and after? Any shortness of breath or tiredness?",
  anxious: "I hear you, and it's completely okay to feel anxious. That's a very normal part of recovery. Would you like to try a short breathing exercise together? Or I can share some tips from your care team.",
  question: "Of course! Ask away — I'll do my best to help. For anything that needs a medical answer, I'll make sure to flag it for Nurse Rivera too.",
  skipped: "No worries at all, Maria. Recovery isn't always a straight line. What got in the way today? Let's see if we can make tomorrow a little easier.",
  default: "Thank you for sharing that with me, Maria. It sounds like you're really doing your best, and that matters. Would you like me to note this in your daily log for Nurse Rivera?",
}

const quickReplies = [
  { label: "I completed my walk!", key: "walk" },
  { label: "I'm feeling anxious", key: "anxious" },
  { label: "I have a question", key: "question" },
  { label: "I skipped today", key: "skipped" },
]

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const lower = text.toLowerCase()
      const key = Object.keys(aiReplies).find((k) => lower.includes(k)) || "default"
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: aiReplies[key],
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 2000)
  }

  return (
    <PageShell title="Daily Check-In">
      <h1 className="text-3xl font-bold mb-1">Daily Check-In with Pulse 💬</h1>
      <p className="text-muted-foreground text-base mb-4">
        Talk to me like a caring friend. I&apos;m always here.
      </p>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
        <div className="p-4 space-y-4 min-h-72 max-h-[50vh] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-1">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
              )}
              <div
                className={`max-w-[82%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-primary/10 text-foreground rounded-tl-sm"
                    : "bg-primary text-white rounded-tr-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <div className="border-t border-border p-3 grid grid-cols-2 gap-2">
          {quickReplies.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => sendMessage(label)}
              className="text-left bg-secondary rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors active:scale-[0.97]"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2">
          <button
            aria-label="Voice input (coming soon)"
            className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
          >
            <Mic className="w-7 h-7" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Type how you're feeling..."
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
            aria-label="Type your message"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </PageShell>
  )
}
