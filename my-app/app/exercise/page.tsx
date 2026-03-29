"use client"

import { useState } from "react"
import { Play, ShieldCheck, Clock, Flame, ChevronRight } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"

const fearEmojis = ["😊", "🙂", "😐", "😟", "😟", "😕", "😰", "😰", "😱", "😱"]

const gentleSession = {
  name: "Gentle Start",
  duration: "5 min",
  intensity: "Very Light",
  description: "Slow deep breathing, gentle arm circles, and seated marching. Perfect when you need a calm, safe start.",
  steps: ["2 min deep breathing", "1 min gentle arm circles", "2 min seated marching"],
  color: "bg-green-50 border-green-200",
  badge: "bg-green-100 text-green-700",
}

const standardSession = {
  name: "Today's Session",
  duration: "20 min",
  intensity: "Light-Moderate",
  description: "A balanced cardiac rehab session with warm-up, walking exercise, and cool-down tailored for Week 3.",
  steps: ["5 min warm-up walk", "10 min moderate walking", "5 min cool-down stretch"],
  color: "bg-blue-50 border-blue-200",
  badge: "bg-blue-100 text-blue-700",
}

export default function ExercisePage() {
  const [fearScore, setFearScore] = useState(4)
  const [started, setStarted] = useState(false)

  const session = fearScore >= 7 ? gentleSession : standardSession

  return (
    <PageShell title="Exercise">
      <h1 className="text-3xl font-bold mb-2">Your Home Workout 🏃</h1>

      {/* Fear Check Slider */}
      <section className="bg-white rounded-2xl border border-border p-5 mb-5 shadow-sm">
        <h2 className="text-xl font-semibold mb-1">Fear Check</h2>
        <p className="text-muted-foreground text-base mb-4 leading-relaxed">
          How nervous do you feel about moving today?
        </p>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl" aria-hidden="true">😊</span>
          <input
            type="range"
            min={1}
            max={10}
            value={fearScore}
            onChange={(e) => setFearScore(Number(e.target.value))}
            aria-label="Fear/anxiety level from 1 (calm) to 10 (very nervous)"
            className="flex-1 h-3 accent-primary cursor-pointer"
          />
          <span className="text-3xl" aria-hidden="true">😰</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Calm &mdash; Very Nervous</p>
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
            <span className="text-2xl">{fearEmojis[fearScore - 1]}</span>
            <span className="text-xl font-bold text-foreground">{fearScore}/10</span>
          </div>
        </div>
        {fearScore >= 7 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-amber-800 text-base font-medium">
              It sounds like you need a gentle approach today — and that is perfectly okay.
            </p>
          </div>
        )}
      </section>

      {/* Recommended Session Card */}
      <section className={`rounded-2xl border-2 p-5 mb-5 ${session.color}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${session.badge}`}>
              Recommended
            </span>
            <h2 className="text-2xl font-bold mt-2">{session.name}</h2>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {session.duration}
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {session.intensity}
            </div>
          </div>
        </div>
        <p className="text-base text-foreground/80 leading-relaxed mb-4">{session.description}</p>
        <ol className="space-y-2">
          {session.steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3 text-base">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/70 font-bold text-sm text-foreground shrink-0">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Video player placeholder */}
      <section className="bg-slate-900 rounded-2xl overflow-hidden mb-5 aspect-video flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          {started ? (
            <div className="text-white text-center px-6">
              <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center mb-3 mx-auto">
                <Clock className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-white text-xl font-semibold">Session in progress...</p>
              <p className="text-white/60 text-base mt-1">Follow along with your care team plan</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => setStarted(true)}
                aria-label="Start workout video"
                className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center hover:bg-white/30 transition-colors active:scale-95"
              >
                <Play className="w-9 h-9 text-white fill-white ml-1" />
              </button>
              <p className="text-white/80 text-base">Tap to start your session</p>
            </>
          )}
        </div>
      </section>

      {/* Start button */}
      {!started && (
        <button
          onClick={() => setStarted(true)}
          className="w-full bg-primary text-white text-xl font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md mb-4"
        >
          <Play className="w-6 h-6 fill-white" />
          Start Session
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Safety banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-amber-800 text-base leading-relaxed">
          <strong>Safety first:</strong> Always follow your care team&apos;s exercise plan. Stop if you feel chest pain, dizziness, or shortness of breath.
        </p>
      </div>
    </PageShell>
  )
}
