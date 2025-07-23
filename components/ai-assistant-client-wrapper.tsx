"use client"
import dynamic from "next/dynamic"
import React from "react"

const AiAssistant = dynamic(() => import("@/components/ui/ai-assistant"), { ssr: false })

export default function AiAssistantClientWrapper() {
  return <AiAssistant />
}
