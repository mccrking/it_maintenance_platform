import type { NextApiRequest, NextApiResponse } from "next"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request" })
  }
  try {
    const { text } = await generateText({
      model: groq("llama3-8b-8192"),
      prompt: `You are an IT support assistant for a maintenance platform. Answer user questions, help with ticket creation, and provide troubleshooting advice.\n\nConversation:\n${messages.map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")}\nAssistant:`,
      maxTokens: 200,
      temperature: 0.2,
    })
    res.status(200).json({ reply: text.trim() })
  } catch (error) {
    res.status(500).json({ reply: "Sorry, I couldn't process your request." })
  }
}
