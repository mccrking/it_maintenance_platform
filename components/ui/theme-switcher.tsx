"use client"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="w-8 h-8" />
  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Thème clair"
        className={`p-2 rounded ${theme === "light" ? "bg-blue-100" : ""}`}
        onClick={() => setTheme("light")}
      >
        <Sun className="w-5 h-5" />
      </button>
      <button
        aria-label="Thème sombre"
        className={`p-2 rounded ${theme === "dark" ? "bg-gray-800 text-white" : ""}`}
        onClick={() => setTheme("dark")}
      >
        <Moon className="w-5 h-5" />
      </button>
      <button
        aria-label="Thème système"
        className={`p-2 rounded ${theme === "system" ? "bg-green-100" : ""}`}
        onClick={() => setTheme("system")}
      >
        <Monitor className="w-5 h-5" />
      </button>
    </div>
  )
}
