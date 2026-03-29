"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, AlertTriangle, TrendingUp, Stethoscope } from "lucide-react"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/copilot", icon: MessageCircle, label: "Check-In" },
  { href: "/sos", icon: AlertTriangle, label: "SOS", danger: true },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/care", icon: Stethoscope, label: "Care" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-area-pb"
    >
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {navItems.map(({ href, icon: Icon, label, danger }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-4 min-w-[56px] transition-colors ${
                danger
                  ? isActive
                    ? "text-destructive"
                    : "text-destructive/70 hover:text-destructive"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {danger ? (
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                    isActive ? "bg-destructive text-white" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              )}
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
