"use client"

import Link from "next/link"
import { Heart, Utensils, Dumbbell, MessageCircle, Users, AlertTriangle, TrendingUp } from "lucide-react"
import { PageShell } from "@/components/pulse/page-shell"
import { useState } from "react"
import { signIn, useSession } from "next-auth/react"

const featureCards = [
  {
    href: "/nutrition",
    icon: Utensils,
    label: "Nutrition",
    desc: "Grocery Guard",
    color: "bg-green-50 text-green-700 border-green-200",
    iconBg: "bg-green-100",
  },
  {
    href: "/exercise",
    icon: Dumbbell,
    label: "Exercise",
    desc: "Home Workout",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: "bg-blue-100",
  },
  {
    href: "/copilot",
    icon: MessageCircle,
    label: "Daily Check-In",
    desc: "Talk to Pulse",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    iconBg: "bg-indigo-100",
  },
  {
    href: "/buddy",
    icon: Users,
    label: "Buddy Network",
    desc: "Recovery Buddies",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-100",
  },
  {
    href: "/sos",
    icon: AlertTriangle,
    label: "Emergency SOS",
    desc: "Get Help Fast",
    color: "bg-red-50 text-red-700 border-red-200",
    iconBg: "bg-red-100",
    danger: true,
  },
  {
    href: "/progress",
    icon: TrendingUp,
    label: "Weekly Progress",
    desc: "Your Wins",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    iconBg: "bg-violet-100",
  },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [chatOpen, setChatOpen] = useState(false)
  const sessionsComplete = 8
  const totalSessions = 36
  const progressPercent = Math.round((sessionsComplete / totalSessions) * 100)
  const isAuthenticated = status === "authenticated"
  const displayName =
    session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "there"

  return (
    <PageShell showBack={false}>
      {/* Welcome */}
      <section className="mb-6">
        <p className="text-muted-foreground text-lg mb-1">Good Morning,</p>
        <h1 className="text-4xl font-bold text-foreground text-balance leading-tight">
          {isAuthenticated ? (
            <>
              {displayName} <span className="wave inline-block">👋</span>
            </>
          ) : (
            "Sign in to get started"
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAuthenticated
            ? "Let’s keep that heart strong today."
            : "Connect your Google account to personalize the Buddy Network and live app features."}
        </p>
        {!isAuthenticated && (
          <button
            onClick={() => signIn("google")}
            className="mt-4 rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90"
          >
            Sign In with Google
          </button>
        )}
      </section>

      {/* Rehab Progress Card */}
      <section className="bg-primary rounded-2xl p-6 text-white mb-6 shadow-md">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white/80 text-white/80" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-wide">
              Recovery Program Progress
            </span>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/85">
            Demo Data
          </span>
        </div>
        <p className="text-2xl font-bold mb-1">
          {sessionsComplete} of {totalSessions} sessions complete
        </p>
        <p className="text-white/80 text-lg mb-4">Week 3 of 12</p>

        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-4 overflow-hidden">
          <div
            className="bg-white rounded-full h-4 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={sessionsComplete}
            aria-valuemin={0}
            aria-valuemax={totalSessions}
            aria-label={`${sessionsComplete} of ${totalSessions} sessions complete`}
          />
        </div>
        <p className="text-white/70 text-sm mt-2">{progressPercent}% complete — keep going!</p>
        <p className="text-white/70 text-xs mt-3">
          This card shows the current rehab demo dataset. Login personalizes identity and buddy features, not the rehab record.
        </p>
      </section>

      {/* Feature Cards Grid */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">What would you like to do?</h2>
        <div className="grid grid-cols-2 gap-4">
          {featureCards.map(({ href, icon: Icon, label, desc, color, iconBg, danger }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-transform active:scale-95 ${color} ${
                danger ? "col-span-2" : ""
              }`}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg leading-tight">{label}</span>
              <span className="text-sm opacity-70 mt-0.5">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Floating AI Copilot button */}
      <div className="fixed bottom-24 right-5 z-50">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          aria-label="Open AI Co-Pilot chat"
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all font-semibold text-base"
        >
          <MessageCircle className="w-5 h-5" />
          Ask Pulse
        </button>
      </div>

      {/* Mini chat overlay */}
      {chatOpen && (
        <div className="fixed bottom-40 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-white/80" />
              <span className="font-semibold">Pulse AI</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
          </div>
          <div className="p-4">
            <div className="bg-primary/10 rounded-2xl rounded-tl-sm p-3 mb-3 text-sm text-foreground">
              {isAuthenticated
                ? `Hi ${displayName}! How can I help you today? I can answer nutrition questions, help with your workout, or just check in.`
                : "Hi there! Sign in if you want your live user identity reflected across the app, or open the full chat to continue."}
            </div>
            <Link
              href="/copilot"
              onClick={() => setChatOpen(false)}
              className="block text-center bg-primary text-white py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Open Full Chat
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  )
}
