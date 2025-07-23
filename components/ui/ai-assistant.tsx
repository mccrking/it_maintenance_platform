"use client"

import { useState, useRef } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"


interface AiAssistantProps {
  context?: string;
}

export default function AiAssistant({ context }: AiAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setMessages((msgs) => [...msgs, { role: "user", content: input }])
    setLoading(true)
    setInput("")
    try {
      // Appel à l'API AI
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: input }] }),
      });
      if (!res.ok) {
        throw new Error("API error");
      }
      const data = await res.json();
      // Si la réponse est vide ou non pertinente, fallback
      const reply = typeof data.reply === "string" && data.reply.trim().length > 0
        ? data.reply
        : "Je suis votre assistant IT. Posez-moi vos questions sur les tickets, la plateforme ou la gestion informatique !";
      setMessages((msgs) => [...msgs, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, {
        role: "assistant",
        content:
          "Je suis votre assistant IT. Je n'ai pas pu contacter le serveur AI, mais je peux vous aider à naviguer sur la plateforme, comprendre les tickets, ou répondre à vos questions sur la gestion informatique."
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      {!open && (
        <button
          aria-label="Open AI Assistant"
          className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full shadow-lg p-3 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      {/* Assistant window */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs w-full">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AI Assistant</CardTitle>
              <button
                aria-label="Close AI Assistant"
                className="ml-2 text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </CardHeader>
            <CardContent className="h-48 overflow-y-auto flex flex-col gap-2 text-sm">
              {messages.length === 0 && <div className="text-muted-foreground">Ask me anything about IT support, tickets, or the platform!</div>}
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "text-right" : "text-left text-primary"}>
                  <span className="inline-block rounded px-2 py-1 bg-muted">{msg.content}</span>
                </div>
              ))}
              {loading && <div className="text-muted-foreground">Thinking...</div>}
            </CardContent>
            <CardFooter>
              <form onSubmit={sendMessage} className="flex gap-2 w-full">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  disabled={loading}
                  className="flex-1"
                  autoComplete="off"
                />
                <Button type="submit" disabled={loading || !input.trim()}>Send</Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  )
}

