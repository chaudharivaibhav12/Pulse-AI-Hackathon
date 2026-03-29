"use client"

import { useState } from "react"
import { MapPin, MessageCircle, Calendar, Info } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"

const buddies = [
  {
    id: "robert",
    name: "Robert",
    age: 63,
    week: 6,
    distance: "2.1 miles away",
    initials: "RJ",
    color: "bg-blue-400",
    sessions: 18,
    streak: 7,
  },
  {
    id: "diane",
    name: "Diane",
    age: 55,
    week: 3,
    distance: "3.4 miles away",
    initials: "DM",
    color: "bg-violet-400",
    sessions: 9,
    streak: 4,
  },
]

export default function BuddyPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [planned, setPlanned] = useState<Record<string, boolean>>({})

  return (
    <PageShell title="Buddy Network">
      <h1 className="text-3xl font-bold mb-2">Your Recovery Buddies 🤝</h1>
      <p className="text-muted-foreground text-base mb-5 leading-relaxed">
        Stay motivated with people who understand your journey.
      </p>

      {/* Buddy cards */}
      <div className="space-y-4 mb-6">
        {buddies.map((buddy) => (
          <div key={buddy.id} className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-full ${buddy.color} flex items-center justify-center shrink-0`}>
                <span className="text-white text-xl font-bold">{buddy.initials}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{buddy.name}</h2>
                <p className="text-muted-foreground text-base">Age {buddy.age} &middot; Week {buddy.week} of rehab</p>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  {buddy.distance}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{buddy.sessions}</p>
                <p className="text-xs text-muted-foreground">sessions</p>
              </div>
            </div>

            {/* Streak */}
            <div className="bg-amber-50 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span className="text-amber-800 text-sm font-medium">{buddy.streak}-day streak</span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConnected((prev) => ({ ...prev, [buddy.id]: true }))}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold transition-colors active:scale-[0.97] ${
                  connected[buddy.id]
                    ? "bg-primary/10 text-primary border-2 border-primary"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {connected[buddy.id] ? "Connected" : "Connect"}
              </button>
              <button
                onClick={() => setPlanned((prev) => ({ ...prev, [buddy.id]: true }))}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold border-2 transition-colors active:scale-[0.97] ${
                  planned[buddy.id]
                    ? "bg-accent/10 text-accent border-accent"
                    : "border-border text-foreground hover:bg-secondary"
                }`}
              >
                <Calendar className="w-5 h-5" />
                {planned[buddy.id] ? "Planned!" : "Plan Together"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recovery Circle */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-5">
        <h2 className="text-xl font-bold mb-4">Recovery Circle</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex -space-x-3">
            {[
              { initials: "M", color: "bg-primary" },
              { initials: "RJ", color: "bg-blue-400" },
              { initials: "DM", color: "bg-violet-400" },
            ].map((a, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-full ${a.color} border-2 border-white flex items-center justify-center`}
              >
                <span className="text-white text-sm font-bold">{a.initials}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-foreground font-semibold text-base">You + Robert + Diane</p>
            <p className="text-muted-foreground text-sm">3 members strong</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-amber-800 font-bold text-base leading-none">5 days</p>
              <p className="text-amber-600 text-xs">Group Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary rounded-xl p-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Connect for support and motivation — medical questions should always go to your care team.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
