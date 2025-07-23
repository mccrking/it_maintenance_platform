"use client"
import React, { useRef, ChangeEvent } from "react"
import { logAuditEvent } from "@/lib/audit"
import { Button } from "./button"

type ExportImportBarProps = {
  filteredTickets: any[]
  supabase: any
  toast: any
  fetchTicketsRef: React.MutableRefObject<() => void>
}

export function ExportImportBar({ filteredTickets, supabase, toast, fetchTicketsRef }: ExportImportBarProps) {
  const importPDFRef = useRef<HTMLInputElement>(null)
  async function handleImportPDF(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const { importTicketsFromPDF } = await import("@/lib/pdf-export")
    const tickets = await importTicketsFromPDF(file)
    let importedCount = 0
    for (const ticket of tickets) {
      await supabase.from("tickets").insert({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        category: ticket.category,
        created_at: ticket.created_at || new Date().toISOString()
      })
      importedCount++
    }
    // Audit log: record import action
    const user = await supabase.auth.getUser()
    if (user?.data?.user?.id) {
      await logAuditEvent({
        userId: user.data.user.id,
        action: "import_tickets_pdf",
        details: `Imported ${importedCount} tickets from PDF`,
      })
    }
    toast({ title: "Import PDF Complete", description: `Imported ${importedCount} tickets.`, variant: "success" })
    fetchTicketsRef.current && fetchTicketsRef.current()
    if (importPDFRef.current) importPDFRef.current.value = ""
  }
  const importRef = useRef<HTMLInputElement>(null)
  async function handleExportCSV() {
    const headers = ["ID", "Title", "Description", "Status", "Category", "Created At"]
    const rows = filteredTickets.map((t: any) => [t.id, t.title, t.description, t.status, t.category, t.created_at])
    const csv = [headers.join(","), ...rows.map((r: any) => r.map((x: any) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tickets.csv"
    a.click()
    URL.revokeObjectURL(url)
    // Audit log: record export action
    const user = await supabase.auth.getUser()
    if (user?.data?.user?.id) {
      await logAuditEvent({
        userId: user.data.user.id,
        action: "export_tickets_csv",
        details: `Exported ${filteredTickets.length} tickets to CSV`,
      })
    }
  }

  async function handleExportPDF() {
    // Dynamically import to avoid SSR issues
    const { exportTicketsToPDF } = await import("@/lib/pdf-export")
    exportTicketsToPDF(filteredTickets, "Tickets Report")
    // Audit log: record export action
    const user = await supabase.auth.getUser()
    if (user?.data?.user?.id) {
      await logAuditEvent({
        userId: user.data.user.id,
        action: "export_tickets_pdf",
        details: `Exported ${filteredTickets.length} tickets to PDF`,
      })
    }
  }
  async function handleImportCSV(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const [header, ...rows] = lines
    const columns = header.split(",")
    for (const row of rows) {
      const values = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v: string) => v.replace(/^"|"$/g, ""))
      const ticket: any = {}
      columns.forEach((col, i) => { ticket[col.trim().toLowerCase().replace(/ /g, "_")] = values[i] })
      await supabase.from("tickets").insert({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        category: ticket.category,
        created_at: ticket.created_at || new Date().toISOString()
      })
    }
    // Audit log: record import action
    const user = await supabase.auth.getUser()
    if (user?.data?.user?.id) {
      await logAuditEvent({
        userId: user.data.user.id,
        action: "import_tickets_csv",
        details: `Imported ${rows.length} tickets from CSV`,
      })
    }
    toast({ title: "Import Complete", description: `Imported ${rows.length} tickets.`, variant: "success" })
    fetchTicketsRef.current && fetchTicketsRef.current()
    if (importRef.current) importRef.current.value = ""
  }
  return (
    <div className="mb-6 flex gap-4 items-center">
      <Button size="sm" variant="outline" onClick={handleExportCSV}>Export CSV</Button>
      <Button size="sm" variant="outline" onClick={handleExportPDF}>Exporter PDF</Button>
      <label className="text-sm font-medium">Import CSV:</label>
      <input
        type="file"
        accept=".csv"
        ref={importRef}
        onChange={handleImportCSV}
        className="border rounded px-2 py-1"
        style={{ maxWidth: 200 }}
      />
      <label className="text-sm font-medium">Import PDF:</label>
      <input
        type="file"
        accept=".pdf"
        ref={importPDFRef}
        onChange={handleImportPDF}
        className="border rounded px-2 py-1"
        style={{ maxWidth: 200 }}
      />
    </div>
  )
}
