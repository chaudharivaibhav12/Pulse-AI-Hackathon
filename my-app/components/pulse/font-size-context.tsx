"use client"

import { createContext, useContext, useState, useEffect } from "react"

type FontSize = "sm" | "md" | "lg"

interface FontSizeContextType {
  size: FontSize
  setSize: (s: FontSize) => void
  baseClass: string
}

const FontSizeContext = createContext<FontSizeContextType>({
  size: "md",
  setSize: () => {},
  baseClass: "text-base",
})

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState<FontSize>("md")

  const baseClass =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base"

  // Apply root font scale
  useEffect(() => {
    const root = document.documentElement
    const scales: Record<FontSize, string> = {
      sm: "16px",
      md: "18px",
      lg: "22px",
    }
    root.style.fontSize = scales[size]
  }, [size])

  return (
    <FontSizeContext.Provider value={{ size, setSize, baseClass }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  return useContext(FontSizeContext)
}
