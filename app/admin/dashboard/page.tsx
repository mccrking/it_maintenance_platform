"use client"

import { AuditLogViewer } from "@/components/ui/audit-log-viewer"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getUserProfile } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Inbox, Wrench, CheckCircle, Users, BarChart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ticket } from "lucide-react" // Declaring the Ticket variable
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"


export default function Page() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [totalTicketsCount, setTotalTicketsCount] = useState(0)
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0)
  const [inProgressTicketsCount, setInProgressTicketsCount] = useState(0)
  const [resolvedTicketsCount, setResolvedTicketsCount] = useState(0)
  const [totalUsersCount, setTotalUsersCount] = useState(0)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUserProfile()
        setUserProfile(user)

        if (!user || user.role !== "admin") {
          redirect("/login") // Redirect if not logged in or not an admin
          return
        }

        const supabase = getSupabaseBrowserClient()

        const { count: totalTicketsCount, error: totalTicketsError } = await supabase
          .from("tickets")
          .select("id", { count: "exact" })

        const { count: pendingTicketsCount, error: pendingTicketsError } = await supabase
          .from("tickets")
          .select("id", { count: "exact" })
          .eq("status", "Pending")

        const { count: inProgressTicketsCount, error: inProgressTicketsError } = await supabase
          .from("tickets")
          .select("id", { count: "exact" })
          .eq("status", "In Progress")

        const { count: resolvedTicketsCount, error: resolvedTicketsError } = await supabase
          .from("tickets")
          .select("id", { count: "exact" })
          .eq("status", "Resolved")

        const { count: totalUsersCount, error: totalUsersError } = await supabase.from("profiles").select("id", { count: "exact" })

        if (totalTicketsError || pendingTicketsError || inProgressTicketsError || resolvedTicketsError || totalUsersError) {
          console.error(
            "Error fetching admin dashboard data:",
            totalTicketsError || pendingTicketsError || inProgressTicketsError || resolvedTicketsError || totalUsersError,
          )
          setError("Impossible de charger les données du dashboard.")
        } else {
          setTotalTicketsCount(totalTicketsCount)
          setPendingTicketsCount(pendingTicketsCount)
          setInProgressTicketsCount(inProgressTicketsCount)
          setResolvedTicketsCount(resolvedTicketsCount)
          setTotalUsersCount(totalUsersCount)
        }
      } catch (err) {
        console.error("Error fetching admin dashboard data:", err)
        setError("Impossible de charger les données du dashboard.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="flex flex-col items-center justify-center py-10 text-destructive" role="alert" aria-live="assertive">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="font-semibold" tabIndex={0}>Chargement des données...</span>
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
        
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="flex flex-col items-center justify-center py-10 text-destructive" role="alert" aria-live="assertive">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="font-semibold" tabIndex={0}>{error}</span>
              <Button onClick={() => window.location.reload()} className="mt-4" autoFocus>Réessayer</Button>
            </div>
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

  // Les variables count sont déjà définies ci-dessus

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
     
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Bienvenue, {userProfile.full_name || userProfile.username || "Admin"} !</h1>
            <p className="text-lg text-slate-700 dark:text-slate-200">Voici votre tableau de bord administrateur.</p>
          </header>

          <section aria-label="Ticket and User Summary" className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card role="region" aria-label="Total Tickets" className="shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Ticket className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{totalTicketsCount}</div>
                  <p className="text-xs text-muted-foreground">Tous les tickets du système</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="Pending Tickets" className="shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En attente</CardTitle>
                  <Inbox className="h-5 w-5 text-fuchsia-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{pendingTicketsCount}</div>
                  <p className="text-xs text-muted-foreground">Tickets en attente d'action</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="In Progress Tickets" className="shadow-lg border-2 border-cyan-200 dark:border-cyan-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En cours</CardTitle>
                  <Wrench className="h-5 w-5 text-cyan-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{inProgressTicketsCount}</div>
                  <p className="text-xs text-muted-foreground">Tickets en cours de traitement</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="Resolved Tickets" className="shadow-lg border-2 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Résolus</CardTitle>
                  <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{resolvedTicketsCount}</div>
                  <p className="text-xs text-muted-foreground">Tickets résolus</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="Total Users" className="shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                  <Users className="h-5 w-5 text-fuchsia-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{totalUsersCount}</div>
                  <p className="text-xs text-muted-foreground">Utilisateurs inscrits</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section aria-label="Quick Actions">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-6 flex flex-col items-center text-center shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label="Manage All Tickets">
                <Inbox className="h-10 w-10 mb-4 text-blue-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Gérer les tickets</h3>
                <p className="text-muted-foreground mb-4">Voir, filtrer et gérer tous les tickets IT.</p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 transition-all text-lg rounded-full shadow-lg">
                  <Link href="/admin/tickets">Gérer les tickets</Link>
                </Button>
              </Card>
              <Card className="p-6 flex flex-col items-center text-center shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label="Manage Users">
                <Users className="h-10 w-10 mb-4 text-fuchsia-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Gérer les utilisateurs</h3>
                <p className="text-muted-foreground mb-4">Superviser les comptes et rôles utilisateurs.</p>
                <Button asChild variant="outline" className="text-lg rounded-full border-2 border-fuchsia-400 dark:border-fuchsia-400">
                  <Link href="/admin/users">Gérer les utilisateurs</Link>
                </Button>
              </Card>
              <Card className="p-6 flex flex-col items-center text-center shadow-lg border-2 border-cyan-200 dark:border-cyan-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label="Generate Reports">
                <BarChart className="h-10 w-10 mb-4 text-cyan-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Rapports & exports</h3>
                <p className="text-muted-foreground mb-4">Accéder aux statistiques et exporter les données.</p>
                <Button asChild variant="secondary" className="text-lg rounded-full border-2 border-cyan-400 dark:border-cyan-400">
                  <Link href="/admin/reports">Rapports & exports</Link>
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
