"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("flex items-center justify-center w-full h-full cursor-pointer", className)}>
        <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-300" strokeWidth={1.5} />
      </div>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div
      className={cn("flex items-center justify-center w-full h-full cursor-pointer transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="button"
      tabIndex={0}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-neutral-300" strokeWidth={1.5} />
      ) : (
        <Sun className="w-5 h-5 text-neutral-600" strokeWidth={1.5} />
      )}
    </div>
  )
}

