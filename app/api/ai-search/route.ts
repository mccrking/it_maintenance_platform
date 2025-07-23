import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { question, provider } = await req.json();
  let answer = "Aucune réponse trouvée.";
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ API key missing" }, { status: 500 });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Tu es un assistant qui répond comme une page Wikipédia, structuré, clair, avec titres, paragraphes, listes, liens si possible. Réponds en Markdown." },
        { role: "user", content: question },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  // Log la réponse brute pour debug
  console.log("Groq API response:", JSON.stringify(data, null, 2));
  if (data.choices && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
    answer = data.choices[0].message.content;
  } else if (data.error) {
    answer = `Erreur IA : ${data.error.message || JSON.stringify(data.error)}`;
  }
  return NextResponse.json({ answer });
}
