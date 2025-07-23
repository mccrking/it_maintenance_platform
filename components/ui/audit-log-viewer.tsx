import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, profiles(full_name, username)")
        .order("timestamp", { ascending: false })
        .limit(20)
      if (!error) setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()
  }, [supabase])

  if (loading) return <div>Loading audit logs...</div>
  if (logs.length === 0) return <div>No audit logs found.</div>

  return (
    <Card className="p-4 mt-6">
      <h2 className="text-xl font-bold mb-4">Recent Activity (Audit Log)</h2>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="text-sm">
            <span className="font-medium">{log.profiles?.full_name || log.profiles?.username || "Unknown User"}</span> &mdash; {log.action}
            {log.details && <>: <span className="text-muted-foreground">{log.details}</span></>}
            <span className="ml-2 text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
