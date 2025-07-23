"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Simule une réponse IA (
async function fetchAIResponse(question: string): Promise<string> {
  // Appel API backend Next.js (OpenAI)
  const res = await fetch("/api/ai-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, provider: "openai" }),
  });
  const data = await res.json();
  return data.answer || "Aucune réponse trouvée.";
}

export default function SearchDocPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    const aiAnswer = await fetchAIResponse(question);
    setAnswer(aiAnswer);
    setHistory(prev => [{ q: question, a: aiAnswer }, ...prev]);
    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2"><Bot className="w-7 h-7" /> Documentation IA interactive</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          className="border rounded px-3 py-2 flex-1 bg-background text-foreground"
          placeholder="Pose ta question sur la plateforme, la sécurité, les tickets, etc."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !question.trim()}><Search className="w-4 h-4 mr-1" /> Chercher</Button>
      </form>
      {answer && (
        <Card className="mb-6 p-4 bg-muted">
          <div className="font-semibold mb-2">Réponse IA :</div>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </Card>
      )}
      {history.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-2">Historique des questions</h2>
          <ul className="space-y-4">
            {history.map((item, idx) => (
              <li key={idx} className="bg-background border rounded p-4">
                <div className="text-sm text-muted-foreground mb-1">Question :</div>
                <div className="font-medium mb-2">{item.q}</div>
                <div className="text-sm text-muted-foreground mb-1">Réponse IA :</div>
                <div className="prose prose-base dark:prose-invert max-w-none">
                  <ReactMarkdown>{item.a}</ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
