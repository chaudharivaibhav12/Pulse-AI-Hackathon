"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart } from "lucide-react"
import { useFontSize } from "./font-size-context"

interface AppHeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
}

export function AppHeader({ title, showBack = true, backHref }: AppHeaderProps) {
  const router = useRouter()
  const { size, setSize } = useFontSize()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        {/* Left: back or spacer */}
        <div className="w-12">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
          )}
        </div>

        {/* Center: logo + title */}
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-5 h-5 fill-[var(--pulse-red)] text-[var(--pulse-red)]" />
          <span className="font-bold text-lg text-primary tracking-tight">
            {title || "Pulse AI"}
          </span>
        </Link>

        {/* Right: font size toggle */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-full px-2 py-1">
          {(["sm", "md", "lg"] as const).map((s, i) => {
            const labels = ["A", "AA", "AAA"]
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-label={`Font size ${labels[i]}`}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                  size === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[i]}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
