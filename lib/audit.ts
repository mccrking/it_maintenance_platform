// Audit log utility for recording user actions
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import type { Database } from "@/types/database"

export async function logAuditEvent({ userId, action, details }: { userId: string; action: string; details?: string }) {
  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_id: userId,
          action,
          details,
          timestamp: new Date().toISOString(),
        },
      ])
    if (error) {
      console.error("Audit log error:", error)
    }
  } catch (err) {
    console.error("Audit log exception:", err)
  }
}

// Usage example:
// await logAuditEvent({ userId, action: "ticket_export", details: "Exported 5 tickets" })
