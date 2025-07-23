"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getUserProfile } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Inbox, Wrench, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function TechnicianDashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [assignedTickets, setAssignedTickets] = useState([])
  const [pendingTickets, setPendingTickets] = useState([])
  const [resolvedTickets, setResolvedTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getUserProfile()
        setUserProfile(profile)

        if (!profile || profile.role !== "technician") {
          redirect("/login") // Redirect if not logged in or not a technician
          return
        }

        const supabase = getSupabaseBrowserClient()

        const { data: assignedTicketsData, error: assignedError } = await supabase
          .from("tickets")
          .select("id")
          .eq("assigned_to", profile.id)
          .in("status", ["Pending", "In Progress"])

        if (assignedError) throw assignedError
        setAssignedTickets(assignedTicketsData || [])

        const { data: pendingTicketsData, error: pendingError } = await supabase
          .from("tickets")
          .select("id")
          .eq("status", "Pending")

        if (pendingError) throw pendingError
        setPendingTickets(pendingTicketsData || [])

        const { data: resolvedTicketsData, error: resolvedError } = await supabase
          .from("tickets")
          .select("id")
          .eq("assigned_to", profile.id)
          .eq("status", "Resolved")

        if (resolvedError) throw resolvedError
        setResolvedTickets(resolvedTicketsData || [])

      } catch (err) {
        setError(err)
        console.error("Error fetching technician dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-6 right-8 z-20">
          <ThemeSwitcher />
        </div>
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="flex flex-col items-center justify-center py-10 text-destructive" role="alert" aria-live="assertive">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="font-semibold" tabIndex={0}>Chargement des données du dashboard...</span>
            </div>
          </div>
          <div className="hidden md:flex flex-1 justify-center items-center ml-8">
            <Image src="/logo-it-maintenance.svg" alt="Illustration IT" width={260} height={260} className="drop-shadow-2xl animate-float" />
          </div>
        </div>
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

  if (error) {
    return (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-6 right-8 z-20">
          <ThemeSwitcher />
        </div>
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="flex flex-col items-center justify-center py-10 text-destructive" role="alert" aria-live="assertive">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="font-semibold" tabIndex={0}>Impossible de charger les données du dashboard.</span>
              <Button onClick={() => window.location.reload()} className="mt-4" autoFocus>Réessayer</Button>
            </div>
          </div>
          <div className="hidden md:flex flex-1 justify-center items-center ml-8">
            <Image src="/logo-it-maintenance.svg" alt="Illustration IT" width={260} height={260} className="drop-shadow-2xl animate-float" />
          </div>
        </div>
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

  const assignedCount = assignedTickets?.length || 0
  const pendingCount = pendingTickets?.length || 0
  const resolvedCount = resolvedTickets?.length || 0

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Bienvenue, {userProfile?.full_name || userProfile?.username || "Technicien"} !</h1>
            <p className="text-lg text-slate-700 dark:text-slate-200">Voici votre tableau de bord technicien.</p>
          </header>

          <section aria-label="Ticket Summary" className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card role="region" aria-label="Assigned Tickets" className="shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets assignés</CardTitle>
                  <Wrench className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{assignedCount}</div>
                  <p className="text-xs text-muted-foreground">Tickets actuellement assignés</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="New Pending Tickets" className="shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nouveaux tickets en attente</CardTitle>
                  <Inbox className="h-5 w-5 text-fuchsia-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{pendingCount}</div>
                  <p className="text-xs text-muted-foreground">Tickets en attente d'assignation</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="Resolved by You" className="shadow-lg border-2 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Résolus par vous</CardTitle>
                  <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{resolvedCount}</div>
                  <p className="text-xs text-muted-foreground">Tickets que vous avez résolus</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section aria-label="Quick Actions">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 flex flex-col items-center text-center shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label="View Assigned Tickets">
                <Wrench className="h-10 w-10 mb-4 text-blue-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Voir les tickets assignés</h3>
                <p className="text-muted-foreground mb-4">Gérez les tickets qui vous sont assignés.</p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 transition-all text-lg rounded-full shadow-lg">
                  <Link href="/technician/assigned-tickets">Voir assignés</Link>
                </Button>
              </Card>
              <Card className="p-6 flex flex-col items-center text-center shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label="View All Pending Tickets">
                <Inbox className="h-10 w-10 mb-4 text-fuchsia-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Voir tous les tickets en attente</h3>
                <p className="text-muted-foreground mb-4">Consultez et assignez de nouveaux tickets.</p>
                <Button asChild variant="outline" className="text-lg rounded-full border-2 border-fuchsia-400 dark:border-fuchsia-400">
                  <Link href="/technician/all-tickets">Voir tout</Link>
                </Button>
              </Card>
            </div>
          </section>
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
