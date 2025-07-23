"use client"
import { useState, useEffect } from "react"

export default function DynamicMain({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // On écoute le cookie pour suivre l'état de la sidebar
  useEffect(() => {
    const checkSidebar = () => {
      setSidebarOpen(document.cookie.includes("sidebar:state=true"))
    }
    checkSidebar()
    window.addEventListener("cookiechange", checkSidebar)
    return () => window.removeEventListener("cookiechange", checkSidebar)
  }, [])
  return (
    <main className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "pl-[260px]" : "pl-0"}`}>
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">{children}</div>
    </main>
  )
} 