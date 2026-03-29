"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, MessageCircle, Calendar, Info } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"
import { signIn, signOut, useSession } from "next-auth/react"

type Buddy = {
  id: string
  email: string
  name: string
  image?: string | null
  joinedAt: string
  lastSeenAt: string
}

type RecoveryCircle = {
  streakDays: number
  members: string[]
  lastCheckIn: string
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2)
}

export default function BuddyPage() {
  const { data: session, status } = useSession()
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [planned, setPlanned] = useState<Record<string, boolean>>({})
  const [recoveryCircle, setRecoveryCircle] = useState<RecoveryCircle | null>(null)
  const [loadingBuddyId, setLoadingBuddyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    async function loadConnections() {
      if (!isAuthenticated) {
        setConnected({})
        setPlanned({})
        return
      }

      const res = await fetch("/api/buddy/connections")

      if (!res.ok) {
        setError("Unable to load your buddy connections right now.")
        return
      }

      const data = await res.json()
      setBuddies(data.buddies)
      setConnected(
        Object.fromEntries(
          data.connectionState.connectedBuddyIds.map((buddyId: string) => [buddyId, true])
        )
      )
      setPlanned(
        Object.fromEntries(
          data.connectionState.plannedBuddyIds.map((buddyId: string) => [buddyId, true])
        )
      )
      setRecoveryCircle(data.recoveryCircle)
      setError(null)
    }

    loadConnections()
  }, [isAuthenticated])

  async function updateConnection(
    buddyId: string,
    type: "connected" | "planned",
    value: boolean
  ) {
    if (!isAuthenticated) {
      await signIn("google")
      return
    }

    setLoadingBuddyId(`${type}:${buddyId}`)
    setError(null)

    const res = await fetch("/api/buddy/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buddyId, type, value }),
    })

    if (!res.ok) {
      setError("Unable to update this buddy right now.")
      setLoadingBuddyId(null)
      return
    }

    const data = await res.json()
    setBuddies(data.buddies)
    setConnected(
      Object.fromEntries(
        data.connectionState.connectedBuddyIds.map((id: string) => [id, true])
      )
    )
    setPlanned(
      Object.fromEntries(
        data.connectionState.plannedBuddyIds.map((id: string) => [id, true])
      )
    )
    setRecoveryCircle(data.recoveryCircle)
    setLoadingBuddyId(null)
  }

  const connectedCount = useMemo(
    () => Object.values(connected).filter(Boolean).length,
    [connected]
  )

  return (
    <PageShell title="Buddy Network">
      <h1 className="text-3xl font-bold mb-2">Your Recovery Buddies 🤝</h1>
      <p className="text-muted-foreground text-base mb-5 leading-relaxed">
        Stay motivated with people who understand your journey.
      </p>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6">
        {isAuthenticated ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-semibold text-foreground">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {connectedCount} active buddy connection{connectedCount === 1 ? "" : "s"} in memory
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/buddy" })}
              className="rounded-xl border border-border px-4 py-2 font-semibold text-foreground hover:bg-secondary"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Connect your Google account</p>
              <p className="text-sm text-muted-foreground">
                Sign in to save buddy connections in the in-memory user store for this running app.
              </p>
            </div>
            <button
              onClick={() => signIn("google")}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90"
            >
              Sign In with Google
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Buddy cards */}
      <div className="space-y-4 mb-6">
        {isAuthenticated && buddies.length === 0 && (
          <div className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground shadow-sm">
            No real users are available as buddies yet. Have another user sign in with Google on this running app first.
          </div>
        )}
        {buddies.map((buddy) => (
          <div key={buddy.id} className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center shrink-0 overflow-hidden">
                {buddy.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={buddy.image} alt={buddy.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white text-xl font-bold">{initialsFor(buddy.name)}</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{buddy.name}</h2>
                <p className="text-muted-foreground text-base">{buddy.email}</p>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  Available in this live app session
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">Live user</p>
                <p className="text-xs text-muted-foreground">signed in</p>
              </div>
            </div>

            {/* Streak */}
            <div className="bg-amber-50 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span className="text-amber-800 text-sm font-medium">
                Seen {new Date(buddy.lastSeenAt).toLocaleString()}
              </span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateConnection(buddy.id, "connected", !connected[buddy.id])}
                disabled={loadingBuddyId === `connected:${buddy.id}`}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold transition-colors active:scale-[0.97] ${
                  connected[buddy.id]
                    ? "bg-primary/10 text-primary border-2 border-primary"
                    : "bg-primary text-white hover:bg-primary/90"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <MessageCircle className="w-5 h-5" />
                {loadingBuddyId === `connected:${buddy.id}`
                  ? "Saving..."
                  : connected[buddy.id]
                  ? "Connected"
                  : "Connect"}
              </button>
              <button
                onClick={() => updateConnection(buddy.id, "planned", !planned[buddy.id])}
                disabled={loadingBuddyId === `planned:${buddy.id}`}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold border-2 transition-colors active:scale-[0.97] ${
                  planned[buddy.id]
                    ? "bg-accent/10 text-accent border-accent"
                    : "border-border text-foreground hover:bg-secondary"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Calendar className="w-5 h-5" />
                {loadingBuddyId === `planned:${buddy.id}`
                  ? "Saving..."
                  : planned[buddy.id]
                  ? "Planned!"
                  : "Plan Together"}
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
            {(recoveryCircle?.members ?? ["You"]).slice(0, 3).map((member, i) => (
              <div
                key={`${member}-${i}`}
                className="w-12 h-12 rounded-full bg-primary border-2 border-white flex items-center justify-center"
              >
                <span className="text-white text-sm font-bold">{initialsFor(member)}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-foreground font-semibold text-base">
              {isAuthenticated ? "You + your selected buddies" : "Sign in to build your circle"}
            </p>
            <p className="text-muted-foreground text-sm">
              {(recoveryCircle?.members.length ?? 1)} member{(recoveryCircle?.members.length ?? 1) === 1 ? "" : "s"} in memory
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-amber-800 font-bold text-base leading-none">
                {recoveryCircle?.streakDays ?? 1} days
              </p>
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
