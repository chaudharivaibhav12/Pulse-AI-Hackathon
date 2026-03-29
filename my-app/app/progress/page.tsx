"use client"

import { useState } from "react"
import { Share2, Heart, ShoppingBasket, TrendingUp, Calendar, CheckCircle } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"

const badges = [
  {
    id: "effort",
    icon: Heart,
    name: "Safe Effort",
    desc: "Heart rate in target zone",
    stat: "4 sessions this week!",
    progress: 72,
    color: "text-red-500",
    bg: "bg-red-50",
    ring: "stroke-red-500",
    fill: "stroke-red-500",
  },
  {
    id: "pantry",
    icon: ShoppingBasket,
    name: "Pantry Hero",
    desc: "Healthy food swaps made",
    stat: "6 healthy swaps",
    progress: 60,
    color: "text-green-600",
    bg: "bg-green-50",
    ring: "stroke-green-500",
    fill: "stroke-green-500",
  },
  {
    id: "confidence",
    icon: TrendingUp,
    name: "Confidence Climb",
    desc: "Anxiety score improving",
    stat: "Score: 4.2 → 3.1",
    progress: 55,
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "stroke-blue-500",
    fill: "stroke-blue-500",
  },
  {
    id: "script",
    icon: Calendar,
    name: "Sticking to the Script",
    desc: "Sessions of 36 complete",
    stat: "8 of 36 sessions",
    progress: 22,
    color: "text-violet-600",
    bg: "bg-violet-50",
    ring: "stroke-violet-500",
    fill: "stroke-violet-500",
  },
]

function ProgressRing({ percent, colorClass }: { percent: number; colorClass: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (percent / 100) * circ

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border opacity-40" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        className={colorClass}
      />
    </svg>
  )
}

export default function ProgressPage() {
  const [shared, setShared] = useState(false)

  return (
    <PageShell title="Weekly Progress">
      <h1 className="text-3xl font-bold mb-2">Your Weekly Wins 🏆</h1>
      <p className="text-muted-foreground text-base mb-5 leading-relaxed">
        Week 3 of 12 &mdash; You&apos;re making real progress, Maria.
      </p>

      {/* Weekly summary pill */}
      <div className="flex items-center gap-3 bg-primary/10 rounded-2xl px-5 py-4 mb-6">
        <CheckCircle className="w-7 h-7 text-primary shrink-0" />
        <div>
          <p className="font-bold text-foreground text-base">4 sessions completed this week</p>
          <p className="text-muted-foreground text-sm">Best week yet! Your care team will be proud.</p>
        </div>
      </div>

      {/* Badge Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {badges.map(({ id, icon: Icon, name, desc, stat, progress, color, bg, ring }) => (
          <div key={id} className={`${bg} rounded-2xl border border-border p-5 flex items-center gap-4`}>
            {/* Progress ring */}
            <div className="relative shrink-0">
              <ProgressRing percent={progress} colorClass={ring} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground leading-tight">{name}</h2>
              <p className="text-muted-foreground text-sm">{desc}</p>
              <p className={`text-base font-semibold mt-1 ${color}`}>{stat}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-foreground">{progress}%</p>
              <p className="text-xs text-muted-foreground">goal</p>
            </div>
          </div>
        ))}
      </div>

      {/* Share button */}
      <button
        onClick={() => setShared(true)}
        className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-xl font-bold transition-all active:scale-[0.98] ${
          shared
            ? "bg-accent/10 text-accent border-2 border-accent"
            : "bg-accent text-white hover:bg-accent/90 shadow-md"
        }`}
      >
        <Share2 className="w-6 h-6" />
        {shared ? "Summary sent to Sofia!" : "Share with Sofia"}
      </button>

      {shared && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-800 text-base font-medium">
            Sofia has been notified of your weekly progress. Great work this week!
          </p>
        </div>
      )}
    </PageShell>
  )
}
