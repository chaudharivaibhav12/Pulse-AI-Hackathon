"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Calendar, AlertTriangle, ClipboardList } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"
import { TypingIndicator } from "@/components/pulse/typing-indicator"

interface Message {
  id: string
  role: "user" | "nurse"
  text: string
  time: string
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "nurse",
    text: "Good morning, Maria! I reviewed your last session notes. You're doing wonderfully in Week 3. How are you feeling today? 😊",
    time: "9:02 AM",
  },
  {
    id: "2",
    role: "user",
    text: "Feeling a bit tired but I completed my walk yesterday!",
    time: "9:15 AM",
  },
  {
    id: "3",
    role: "nurse",
    text: "That's fantastic — completing your walk when you're tired shows real dedication! A little fatigue is normal at Week 3. Make sure to stay hydrated and rest between sessions. I've noted it in your chart.",
    time: "9:18 AM",
  },
]

const symptoms = [
  "Chest pain",
  "Shortness of breath",
  "Dizziness",
  "Irregular heartbeat",
  "Swollen ankles",
  "Unusual fatigue",
]

export default function CarePage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ mood: 3, symptoms: [] as string[], sessions: "" })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), time: now }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    setTimeout(() => {
      const nurseMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "nurse",
        text: "Thank you for letting me know, Maria. I'll review that and get back to you shortly. Remember, if anything feels urgent, please use the SOS button.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, nurseMsg])
      setIsTyping(false)
    }, 2200)
  }

  const toggleSymptom = (s: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(s)
        ? prev.symptoms.filter((x) => x !== s)
        : [...prev.symptoms, s],
    }))
  }

  return (
    <PageShell title="Care Team">
      <h1 className="text-3xl font-bold mb-4">Your Care Team 🩺</h1>

      {/* Care Manager Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shrink-0">
            <span className="text-white text-2xl font-bold">NR</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Nurse Rivera</h2>
            <p className="text-muted-foreground text-base">Your assigned care coordinator</p>
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Available
            </span>
          </div>
        </div>

        {/* Next Check-in Banner */}
        <div className="flex items-center gap-3 bg-primary/10 rounded-xl px-4 py-3 mb-3">
          <Calendar className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">Next Check-In</p>
            <p className="text-base font-bold text-primary">Tuesday, April 2 at 10:00 AM</p>
          </div>
        </div>

        {/* Pre-check-in form button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-foreground font-semibold py-3 rounded-xl hover:bg-muted transition-colors text-base"
        >
          <ClipboardList className="w-5 h-5" />
          {showForm ? "Close Pre-Check-In Form" : "Fill Pre-Check-In Form"}
        </button>
      </div>

      {/* Pre-Check-In Form */}
      {showForm && !formSubmitted && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-4">
          <h3 className="text-xl font-bold mb-4">Pre-Check-In Form</h3>

          {/* Mood */}
          <div className="mb-5">
            <label className="text-base font-semibold block mb-2">How are you feeling? (1=Poor, 5=Great)</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setFormData((p) => ({ ...p, mood: n }))}
                  className={`w-12 h-12 rounded-full text-lg font-bold border-2 transition-colors ${
                    formData.mood === n
                      ? "bg-primary text-white border-primary"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-5">
            <label className="text-base font-semibold block mb-2">Any symptoms? (select all that apply)</label>
            <div className="grid grid-cols-2 gap-2">
              {symptoms.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`text-left px-3 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    formData.symptoms.includes(s)
                      ? "bg-destructive/10 border-destructive text-destructive"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions */}
          <div className="mb-5">
            <label htmlFor="sessions" className="text-base font-semibold block mb-2">
              Sessions completed this week:
            </label>
            <input
              id="sessions"
              type="number"
              min={0}
              max={7}
              value={formData.sessions}
              onChange={(e) => setFormData((p) => ({ ...p, sessions: e.target.value }))}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. 4"
            />
          </div>

          <button
            onClick={() => setFormSubmitted(true)}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg hover:bg-primary/90 transition-colors"
          >
            Submit Form
          </button>
        </div>
      )}

      {formSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <p className="text-green-800 font-semibold text-base">
            Form submitted! Nurse Rivera will review it before your Tuesday appointment.
          </p>
        </div>
      )}

      {/* Secure Message Thread */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
        <div className="bg-secondary px-4 py-3 border-b border-border">
          <h3 className="font-bold text-foreground">Secure Messages</h3>
        </div>
        <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "nurse" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mr-2 mt-1">
                  <span className="text-white text-xs font-bold">NR</span>
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[82%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-base leading-relaxed ${
                    msg.role === "nurse"
                      ? "bg-secondary text-foreground rounded-tl-sm"
                      : "bg-primary text-white rounded-tr-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-xs text-muted-foreground px-1">{msg.time}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">NR</span>
              </div>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-border p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Message Nurse Rivera..."
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-destructive text-sm leading-relaxed">
          For emergencies, always call <strong>911</strong> or use the <strong>SOS button</strong> in the app.
          This messaging system is for non-urgent communication only.
        </p>
      </div>
    </PageShell>
  )
}
