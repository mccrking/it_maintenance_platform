"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getUserProfile } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Ticket, Inbox, Wrench, CheckCircle, PlusCircle } from "../../../components/icons"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function ClientDashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUserProfile()
        setUserProfile(user)

        if (!user || user.role !== "client") {
          redirect("/login") // Redirect if not logged in or not a client
        }

        const supabase = getSupabaseBrowserClient()
        const { data: tickets, error } = await supabase
          .from("tickets")
          .select("status")
          .eq("user_id", user.id)
          .order("status")

        if (error) {
          throw error
        }

        const counts =
          tickets?.reduce(
            (acc: Record<string, number>, item: { status: string }) => {
              acc[item.status] = (acc[item.status] || 0) + 1
              return acc
            },
            {} as Record<string, number>,
          ) || {}
        setTicketCounts(counts)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading && !userProfile) {
    return (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="container mx-auto py-8 flex flex-col items-center justify-center" aria-busy="true" aria-live="polite">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><rect x="4" y="4" width="16" height="16" rx="4" fill="#f3f4f6"/><path d="M8 12h8M8 16h4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/></svg>
              <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Client Dashboard</h1>
              <div className="text-muted-foreground text-lg" tabIndex={0}>Loading your tickets...</div>
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
            <div className="container mx-auto py-8 flex flex-col items-center justify-center" role="alert" aria-live="assertive">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Client Dashboard</h1>
              <div className="text-destructive text-lg" tabIndex={0}>Error loading tickets: {error.message}</div>
              <Button onClick={() => window.location.reload()} className="mt-4" autoFocus>Retry</Button>
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

  if (!userProfile) {
    return null // Should not happen if loading and error states are handled
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Bienvenue, {userProfile.full_name || userProfile.username || "Client"} !</h1>
            <p className="text-lg text-slate-700 dark:text-slate-200">Voici votre tableau de bord IT personnalisé.</p>
          </header>

          <section aria-label="Ticket Summary" className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card role="region" aria-label="Total Tickets" className="shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Ticket className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">
                    {Object.values(ticketCounts).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Vos tickets soumis</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="Pending Tickets" className="shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En attente</CardTitle>
                  <Inbox className="h-5 w-5 text-fuchsia-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{ticketCounts["Pending"] || 0}</div>
                  <p className="text-xs text-muted-foreground">Tickets en attente d'action</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="In Progress Tickets" className="shadow-lg border-2 border-cyan-200 dark:border-cyan-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En cours</CardTitle>
                  <Wrench className="h-5 w-5 text-cyan-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{ticketCounts["In Progress"] || 0}</div>
                  <p className="text-xs text-muted-foreground">Tickets en cours de traitement</p>
                </CardContent>
              </Card>
              <Card role="region" aria-label="Resolved or Closed Tickets" className="shadow-lg border-2 border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-zinc-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Résolus/Fermés</CardTitle>
                  <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" aria-live="polite">{(ticketCounts["Resolved"] || 0) + (ticketCounts["Closed"] || 0)}</div>
                  <p className="text-xs text-muted-foreground">Tickets terminés</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section aria-label="Quick Actions">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 flex flex-col items-center text-center shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label="Submit New Ticket">
                <PlusCircle className="h-10 w-10 mb-4 text-blue-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Nouveau ticket</h3>
                <p className="text-muted-foreground mb-4">Signalez un nouveau problème IT rapidement.</p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 transition-all text-lg rounded-full shadow-lg">
                  <Link href="/client/submit-ticket">Soumettre un ticket</Link>
                </Button>
              </Card>
              <Card className="p-6 flex flex-col items-center text-center shadow-lg border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label="View My Tickets">
                <Inbox className="h-10 w-10 mb-4 text-fuchsia-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Mes tickets</h3>
                <p className="text-muted-foreground mb-4">Consultez le statut et l'historique de vos tickets.</p>
                <Button asChild variant="outline" className="text-lg rounded-full border-2 border-fuchsia-400 dark:border-fuchsia-400">
                  <Link href="/client/my-tickets">Voir mes tickets</Link>
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
