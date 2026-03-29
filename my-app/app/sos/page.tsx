"use client"

import { useState } from "react"
import { Phone, AlertTriangle, Heart } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"

const contacts = [
  { name: "Dr. Patel", role: "Cardiologist", initials: "DP", color: "bg-primary", phone: "555-0101" },
  { name: "Nurse Rivera", role: "Care Coordinator", initials: "NR", color: "bg-accent", phone: "555-0102" },
  { name: "Sofia", role: "Daughter (Family)", initials: "S", color: "bg-violet-400", phone: "555-0103" },
]

export default function SOSPage() {
  const [sosActive, setSosActive] = useState(false)
  const [checkMode, setCheckMode] = useState(false)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toggleSymptom(label: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  async function triggerSOS(reason?: string) {
    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const response = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason:
            reason ??
            (selectedSymptoms.length > 0
              ? `Maria reported these symptoms: ${selectedSymptoms.join(", ")}.`
              : "Maria tapped the SOS emergency button and reported feeling unwell."),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatusMessage(data.error ?? "Unable to alert the care team right now.")
        return
      }

      setStatusMessage(data.message ?? "Emergency alert sent to the care team.")
      setSosActive(true)
    } catch {
      setStatusMessage("Unable to alert the care team right now.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sosActive) {
    return (
      <div className="fixed inset-0 bg-blue-100 flex flex-col items-center justify-center z-50 px-6 text-center">
        {/* Breathing animation */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-48 h-48 rounded-full bg-primary/10 animate-ping" />
          <div className="absolute w-36 h-36 rounded-full bg-primary/20 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-primary mb-4">Stay calm, Maria.</h1>
        <p className="text-xl text-foreground leading-relaxed mb-6 max-w-sm">
          I&apos;ve alerted your care team and Sofia. Sit down, lean against a wall.{" "}
          <strong>Breathe with me.</strong>
        </p>

        {/* Breathing prompt */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6 w-full max-w-sm">
          <p className="text-muted-foreground text-base mb-3">Follow the circle:</p>
          <div className="flex items-center justify-center mb-3">
            <div className="w-20 h-20 rounded-full border-4 border-primary animate-pulse bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-sm font-semibold">Breathe</span>
            </div>
          </div>
          <p className="text-foreground font-semibold">Inhale 4s &rarr; Hold 4s &rarr; Exhale 6s</p>
        </div>

        <p className="text-muted-foreground text-base mb-6">
          If this is a life-threatening emergency, call{" "}
          <a href="tel:911" className="text-destructive font-bold text-xl">911</a> immediately.
        </p>

        <button
          onClick={() => {
            setSosActive(false)
            setCheckMode(false)
            setSelectedSymptoms([])
            setStatusMessage(null)
          }}
          className="bg-white border-2 border-primary text-primary font-bold py-4 px-10 rounded-2xl text-lg hover:bg-primary/5 transition-colors"
        >
          I feel better now
        </button>
      </div>
    )
  }

  if (checkMode) {
    return (
      <PageShell title="SOS">
        <h1 className="text-3xl font-bold mb-4">{"Let's check in 🔍"}</h1>
        {statusMessage && (
          <div className="mb-4 rounded-2xl border border-border bg-white p-4 text-sm text-foreground shadow-sm">
            {statusMessage}
          </div>
        )}
        <div className="space-y-4">
          {[
            { label: "Chest pain or pressure?", id: "chest" },
            { label: "Shortness of breath?", id: "breath" },
            { label: "Dizziness or lightheadedness?", id: "dizzy" },
            { label: "Irregular heartbeat?", id: "heart" },
            { label: "Unusual fatigue?", id: "fatigue" },
          ].map(({ label, id }) => (
            <label key={id} className="flex items-center gap-4 bg-white border border-border rounded-2xl px-5 py-4 cursor-pointer hover:bg-secondary transition-colors">
              <input
                type="checkbox"
                id={id}
                checked={selectedSymptoms.includes(label)}
                onChange={() => toggleSymptom(label)}
                className="w-6 h-6 accent-destructive cursor-pointer"
              />
              <span className="text-lg text-foreground">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => void triggerSOS()}
            disabled={isSubmitting}
            className="w-full bg-destructive text-white text-xl font-bold py-5 rounded-2xl hover:bg-destructive/90 active:scale-[0.98] transition-all"
          >
            {isSubmitting ? "Alerting Care Team..." : "Alert My Care Team"}
          </button>
          <button
            onClick={() => {
              setCheckMode(false)
              setSelectedSymptoms([])
              setStatusMessage(null)
            }}
            className="w-full bg-secondary text-foreground text-lg font-semibold py-4 rounded-2xl hover:bg-muted transition-colors"
          >
            I feel fine, go back
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Emergency SOS">
      <h1 className="text-3xl font-bold text-center mb-2">Emergency Help ❤️</h1>
      <p className="text-muted-foreground text-center text-base mb-8">
        Your safety is the priority. Tap if you need help.
      </p>

      {statusMessage && (
        <div className="mb-4 rounded-2xl border border-border bg-white p-4 text-sm text-foreground shadow-sm">
          {statusMessage}
        </div>
      )}

      {/* Big SOS Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => void triggerSOS("Maria tapped the SOS emergency button and needs immediate support.")}
          disabled={isSubmitting}
          aria-label="SOS Emergency button — tap if you feel unwell"
          className="w-56 h-56 rounded-full bg-destructive text-white flex flex-col items-center justify-center shadow-2xl hover:bg-destructive/90 active:scale-95 transition-all border-8 border-red-300 focus:outline-none focus:ring-4 focus:ring-red-400 disabled:opacity-70"
        >
          <AlertTriangle className="w-14 h-14 mb-2 fill-white/20" />
          <span className="text-2xl font-black tracking-tight leading-tight text-center px-4">
            {isSubmitting ? "SENDING ALERT..." : "TAP IF YOU FEEL UNWELL"}
          </span>
        </button>
      </div>

      {/* Secondary check button */}
      <button
        onClick={() => setCheckMode(true)}
        className="w-full bg-amber-400 text-amber-900 text-lg font-bold py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-500 active:scale-[0.98] transition-all mb-8 shadow-md"
      >
        <AlertTriangle className="w-6 h-6" />
        {"I feel something weird — let's check"}
      </button>

      {/* Emergency contacts */}
      <h2 className="text-xl font-semibold mb-4">Emergency Contacts</h2>
      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c.name} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${c.color} flex items-center justify-center shrink-0`}>
              <span className="text-white font-bold text-base">{c.initials}</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-foreground">{c.name}</p>
              <p className="text-muted-foreground text-base">{c.role}</p>
            </div>
            <a
              href={`tel:${c.phone}`}
              aria-label={`Call ${c.name}`}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Phone className="w-6 h-6" />
            </a>
          </div>
        ))}
      </div>

      <p className="text-center text-muted-foreground text-sm mt-6">
        For life-threatening emergencies always call{" "}
        <a href="tel:911" className="text-destructive font-bold">911</a>.
      </p>
    </PageShell>
  )
}
