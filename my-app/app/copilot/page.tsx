"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"
import { TypingIndicator } from "@/components/pulse/typing-indicator"

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
      isFinal: boolean
      length: number
    }
    length: number
  }
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
}

interface Message {
  id: string
  role: "user" | "ai"
  text: string
}

interface CopilotApiResponse {
  reply: string
  current_step: 1 | 2 | 3 | 4 | 5
  sentiment_score: number
  escalate: boolean
  recommendations: string[]
  agent?: string
  error?: string
}

const initialMessages: Message[] = [
  {
    id: "0",
    role: "ai",
    text: "Hi Maria. I’m here for your daily check-in. How are you feeling today, on a scale from 1 to 10?",
  },
]

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
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalTranscriptRef = useRef("")

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    const SpeechRecognitionApi =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined

    if (!SpeechRecognitionApi) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognitionApi()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      finalTranscriptRef.current = ""
      setIsListening(true)
      setStatusMessage("Listening...")
    }

    recognition.onend = () => {
      setIsListening(false)
      setStatusMessage((current) => (current === "Listening..." ? null : current))
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      setStatusMessage(
        event.error === "not-allowed"
          ? "Microphone access was blocked."
          : "Voice input failed. Try again."
      )
    }

    recognition.onresult = (event) => {
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? ""
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += `${transcript} `
        } else {
          interimTranscript += transcript
        }
      }

      setInput(`${finalTranscriptRef.current}${interimTranscript}`.trim())
    }

    recognitionRef.current = recognition
    setSpeechSupported(true)

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    recognitionRef.current?.stop()
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    setStatusMessage(null)
    finalTranscriptRef.current = ""

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text.trim() }),
      })
      const data: CopilotApiResponse = await res.json()

      if (!res.ok) {
        setStatusMessage(data.error ?? "Unable to reach Pulse right now.")
        return
      }

      setCurrentStep(data.current_step)
      setRecommendations(data.recommendations ?? [])

      const aiMsg: Message = {
        id: `${Date.now()}-reply`,
        role: "ai",
        text: data.reply,
      }
      setMessages((prev) => [...prev, aiMsg])

      if (data.escalate) {
        setStatusMessage("Emergency escalation triggered. Care team alert sent.")
      }
    } catch {
      setStatusMessage("Unable to reach Pulse right now.")
    } finally {
      setIsTyping(false)
    }
  }

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setStatusMessage("Speech-to-text is not supported in this browser.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      return
    }

    setStatusMessage(null)
    finalTranscriptRef.current = input ? `${input} ` : ""
    recognitionRef.current.start()
  }

  return (
    <PageShell title="Daily Check-In">
      <h1 className="text-3xl font-bold mb-1">Daily Check-In with Pulse 💬</h1>
      <p className="text-muted-foreground text-base mb-4">
        Talk to Pulse like a supportive coach. This flow now uses the live copilot API.
      </p>

      {statusMessage && (
        <div className="mb-4 rounded-2xl border border-border bg-white p-4 text-sm text-foreground shadow-sm">
          {statusMessage}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Current Check-In Step</p>
        <p className="text-lg font-semibold text-foreground">Step {currentStep} of 5</p>
        {recommendations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recommendations.map((recommendation) => (
              <span
                key={recommendation}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
              >
                {recommendation}
              </span>
            ))}
          </div>
        )}
      </div>

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
              onClick={() => void sendMessage(label)}
              className="text-left bg-secondary rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors active:scale-[0.97]"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2">
          <button
            onClick={toggleListening}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            className={`flex items-center justify-center w-14 h-14 rounded-xl transition-colors ${
              isListening
                ? "bg-destructive text-white hover:bg-destructive/90"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <Mic className="w-7 h-7" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendMessage(input)}
            placeholder="Type how you're feeling..."
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
            aria-label="Type your message"
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || isTyping}
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
