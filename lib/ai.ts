import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function categorizeTicket(title: string, description: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is not set. AI categorization will not work.")
    return "Other" // Default category if AI is not configured
  }

  try {
    const { text } = await generateText({
      model: groq("llama3-8b-8192"), // Using a smaller, faster model for categorization
      prompt: `Categorize the following IT support ticket into one of these categories: 'Hardware', 'Software', 'Network', 'Account', or 'Other'.
      Only return the category name, nothing else.

      Ticket Title: "${title}"
      Ticket Description: "${description}"

      Category:`,
      maxTokens: 10, // Expecting a short response
      temperature: 0, // Make it deterministic
    })

    const category = text.trim()
    const validCategories = ["Hardware", "Software", "Network", "Account", "Other"]

    if (validCategories.includes(category)) {
      return category
    } else {
      console.warn(`AI returned an invalid category: "${category}". Defaulting to 'Other'.`)
      return "Other"
    }
  } catch (error) {
    console.error("Error categorizing ticket with AI:", error)
    return "Other" // Fallback in case of AI error
  }
}
