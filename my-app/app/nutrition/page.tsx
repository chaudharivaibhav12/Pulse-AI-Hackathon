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
    id: "1",
    role: "ai",
    text: "Hi Maria! I'm your Grocery Guard. Tell me what food you want to check, what's in your fridge, or what you'd like to cook. I'll help you make heart-healthy choices. 🥗",
  },
]

const aiResponses: Record<string, string> = {
  label: "Great choice to check the label! Look for sodium under 140mg per serving, saturated fat under 2g, and zero trans fat. For heart health, also watch for added sugars — aim for less than 5g per serving.",
  fridge: "Sounds good! Tell me what ingredients you have and I'll suggest a heart-healthy meal that uses them. Every fresh veggie counts!",
  recipe: "Here's a quick heart-healthy recipe: Baked Salmon with Steamed Broccoli. Season salmon with lemon, garlic, and herbs. Bake at 400°F for 15 minutes. Steam broccoli 5 minutes. Rich in omega-3s and low in sodium — perfect for cardiac rehab!",
  default: "That's a great question! Generally for cardiac rehab, focus on foods low in sodium (under 1,500mg/day), rich in omega-3 fatty acids, high in fiber, and low in saturated fats. Fruits, vegetables, whole grains, and lean proteins are your best friends.",
}

const quickActions = [
  { label: "Check a food label", key: "label" },
  { label: "What's in my fridge?", key: "fridge" },
  { label: "Show me a quick recipe", key: "recipe" },
]

export default function NutritionPage() {
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
      const key = Object.keys(aiResponses).find((k) => lower.includes(k)) || "default"
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: aiResponses[key],
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 1800)
  }

  return (
    <PageShell title="Nutrition">
      <h1 className="text-3xl font-bold mb-2">Your Grocery Guard 🥗</h1>
      <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
        Ask me anything about food, labels, or recipes.
      </p>

      {/* Chat window */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
        <div className="p-4 space-y-4 min-h-64 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
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
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask about a food, ingredient, or recipe..."
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
            aria-label="Type your nutrition question"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
          <button
            aria-label="Voice input (coming soon)"
            className="flex items-center justify-center w-12 h-12 bg-secondary text-muted-foreground rounded-xl hover:bg-muted transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="space-y-3">
        <p className="text-base font-semibold text-muted-foreground">Quick options:</p>
        {quickActions.map(({ label, key }) => (
          <button
            key={key}
            onClick={() => sendMessage(label)}
            className="w-full text-left bg-white border-2 border-border rounded-2xl px-5 py-4 text-base font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-colors active:scale-[0.98]"
          >
            {label}
          </button>
        ))}
      </div>
    </PageShell>
  )
}
