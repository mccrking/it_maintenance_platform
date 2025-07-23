"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Download, FileText, BarChart3, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("tickets")
        .select(`id, status, category, assigned_to, profiles:profiles!tickets_assigned_to_fkey(full_name, username)`)
      if (error) {
        setError(error.message)
        setTickets([])
      } else {
        setTickets(data || [])
      }
      setLoading(false)
    }
    fetchTickets()
  }, [])

  // Group and count by status
  const ticketsByStatus: { status: string | null; count: number }[] = []
  const statusMap = new Map<string | null, number>()
  tickets.forEach(ticket => {
    statusMap.set(ticket.status, (statusMap.get(ticket.status) || 0) + 1)
  })
  statusMap.forEach((count, status) => {
    ticketsByStatus.push({ status, count })
  })

  // Group and count by category
  const ticketsByCategory: { category: string | null; count: number }[] = []
  const categoryMap = new Map<string | null, number>()
  tickets.forEach(ticket => {
    categoryMap.set(ticket.category, (categoryMap.get(ticket.category) || 0) + 1)
  })
  categoryMap.forEach((count, category) => {
    ticketsByCategory.push({ category, count })
  })

  // Group and count by technician
  const ticketsByTechnician: { assigned_to: string | null; count: number; assigned_technician?: { full_name?: string | null; username?: string | null } | null }[] = []
  const technicianMap = new Map<string | null, { count: number; assigned_technician: { full_name?: string | null; username?: string | null } | null }>()
  tickets.forEach(ticket => {
    const key = ticket.assigned_to
    const tech = ticket.profiles || null
    if (!technicianMap.has(key)) {
      technicianMap.set(key, { count: 1, assigned_technician: tech })
    } else {
      const prev = technicianMap.get(key)!
      technicianMap.set(key, { count: prev.count + 1, assigned_technician: tech })
    }
  })
  technicianMap.forEach((value, assigned_to) => {
    ticketsByTechnician.push({ assigned_to, count: value.count, assigned_technician: value.assigned_technician })
  })

  const averageResolutionTime = "N/A (Future Feature)"

  if (error) {
    return <div className="text-destructive">Erreur lors du chargement des rapports : {error}</div>
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Rapports & analytics</h1>
          <p className="text-lg text-slate-700 dark:text-slate-200 mb-8">Générez et visualisez des statistiques sur votre activité IT.</p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10" aria-busy="true" aria-live="polite" role="status">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4" tabIndex={0} aria-label="Loading spinner"></div>
              <div tabIndex={0}>Chargement des rapports...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets par statut</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {ticketsByStatus?.map((item: { status: string | null; count: number }) => (
                      <li key={item.status ?? 'unknown'}>
                        {item.status ?? 'Inconnu'}: <span className="font-bold text-foreground">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-4 bg-transparent" size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Télécharger CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets par catégorie</CardTitle>
                  <FileText className="h-4 w-4 text-fuchsia-500" />
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {ticketsByCategory?.map((item: { category: string | null; count: number }) => (
                      <li key={item.category ?? 'uncategorized'}>
                        {item.category ?? "Non catégorisé"}: <span className="font-bold text-foreground">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-4 bg-transparent" size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Télécharger CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-cyan-200 dark:border-cyan-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets par technicien</CardTitle>
                  <Users className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {ticketsByTechnician?.map((item: { assigned_to: string | null; count: number; assigned_technician?: { full_name?: string | null; username?: string | null } | null }) => (
                      <li key={item.assigned_to ?? 'unassigned'}>
                        {item.assigned_technician?.full_name ?? item.assigned_technician?.username ?? "Non assigné"}: {" "}
                        <span className="font-bold text-foreground">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-4 bg-transparent" size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Télécharger CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temps moyen de résolution</CardTitle>
                  <Clock className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageResolutionTime}</div>
                  <p className="text-xs text-muted-foreground">Temps entre création et résolution</p>
                  <Button className="mt-4 bg-transparent" size="sm" variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" /> Télécharger CSV (bientôt)
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader>
                  <CardTitle>Rapports individuels de tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Vous pouvez générer des rapports détaillés pour chaque ticket résolu depuis la page "Gérer tous les tickets".
                  </p>
                  <Button asChild>
                    <Link href="/admin/tickets">Aller à la gestion des tickets</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        
      </div>
      {/* Animation gradient keyframes et fade-in */}
      <style>{`
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientMove 8s ease-in-out infinite;
        }
        @keyframes gradientMove {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in-up {
          opacity: 0;
          transform: translateY(40px);
          animation: fadeInUp 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.2s forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite alternate;
        }
        @keyframes float {
          0% { transform: translateY(0); }
          100% { transform: translateY(-16px); }
        }
      `}</style>
    </div>
  )
}
