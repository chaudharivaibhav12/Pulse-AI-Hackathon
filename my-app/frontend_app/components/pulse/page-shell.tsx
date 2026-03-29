"use client"

import { AppHeader } from "./app-header"
import { BottomNav } from "./bottom-nav"
import { FontSizeProvider } from "./font-size-context"

interface PageShellProps {
  children: React.ReactNode
  title?: string
  showBack?: boolean
  backHref?: string
}

export function PageShell({ children, title, showBack = true, backHref }: PageShellProps) {
  return (
    <FontSizeProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader title={title} showBack={showBack} backHref={backHref} />
        <main className="flex-1 overflow-y-auto pb-28 max-w-2xl mx-auto w-full px-4 pt-4">
          {children}
        </main>
        <BottomNav />
      </div>
    </FontSizeProvider>
  )
}
