"use client"
import { useState } from "react";
import AiAssistant from "../../components/ui/ai-assistant";

export default function AiUniversalPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour, comment puis-je vous aider aujourd'hui ?" },
  ]);
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    // Simuler une réponse IA
    setTimeout(() => {
      setMessages(msgs => [...msgs, { role: "assistant", content: "Votre demande a été prise en compte." }]);
    }, 800);
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Assistant IA universel</h1>
      <section className="mb-8">
        <div className="border rounded p-4 bg-gray-50">
          <div className="mb-4 h-64 overflow-y-auto" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
                <span className={msg.role === "user" ? "bg-blue-100 p-2 rounded" : "bg-green-100 p-2 rounded"}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Posez votre question..."
              aria-label="Entrer une question pour l'assistant IA"
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleSend}
              aria-label="Envoyer la question à l'assistant IA"
            >Envoyer</button>
          </div>
        </div>
      </section>
      <section>
        <AiAssistant />
      </section>
    </main>
  );
}
