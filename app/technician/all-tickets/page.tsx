"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { assignTicket } from "@/lib/tickets"
import { Wrench, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import type { Profile } from "@/types/database"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

type TicketWithRelations = {
  assigned_to: string | null;
  attachment_url: string | null;
  category: string | null;
  comments: any;
  created_at: string;
  description: string;
  id: string;
  solution: string | null;
  status: string;
  title: string;
  user_id: string;
  profiles?: { full_name?: string | null; username?: string | null };
  assigned_technician?: { full_name?: string | null; username?: string | null };
}

export default function AllTicketsPage() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [technicians, setTechnicians] = useState<Profile[]>([])
  const [filteredTickets, setFilteredTickets] = useState<TicketWithRelations[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [currentTechId, setCurrentTechId] = useState<string>("")
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: user, error: userError } = await supabase.auth.getUser()
      if (userError || !user.user) {
        toast({
          title: "Authentication Error",
          description: "Please log in.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setCurrentTechId(user.user.id)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.user.id)
        .single()

      if (profileError || profile?.role !== "technician") {
        toast({
          title: "Permission Denied",
          description: "You do not have access to this page.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select(
          `
          *,
          profiles!tickets_user_id_fkey(full_name, username),
          assigned_technician:profiles!tickets_assigned_to_fkey(full_name, username)
        `,
        )
        .order("created_at", { ascending: false })

      const { data: techniciansData, error: techError } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("role", "technician")

      if (ticketsError || techError) {
        console.error("Error fetching data:", ticketsError || techError)
        toast({
          title: "Error",
          description: "Failed to load tickets or technicians.",
          variant: "destructive",
        })
      } else {
        setTickets(ticketsData as TicketWithRelations[])
        setTechnicians(techniciansData as Profile[])
      }
      setLoading(false)
    }
    fetchData()

    const channel = supabase
      .channel("all-tickets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, (_payload: any) => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast])

  useEffect(() => {
    let currentFiltered = tickets

    // Filter by search term
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (selectedStatus !== "all") {
      currentFiltered = currentFiltered.filter((ticket) => ticket.status === selectedStatus)
    }

    // Filter by category
    if (selectedCategory !== "all") {
      currentFiltered = currentFiltered.filter((ticket) => ticket.category === selectedCategory)
    }

    setFilteredTickets(currentFiltered)
  }, [tickets, searchTerm, selectedStatus, selectedCategory])

  const allCategories = Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean) as string[]

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
            <div className="flex flex-col items-center justify-center py-10" aria-busy="true" aria-live="polite" role="status">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4" tabIndex={0} aria-label="Loading spinner"></div>
              <div tabIndex={0}>Chargement des tickets...</div>
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

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-6 right-8 z-20">
        <ThemeSwitcher />
      </div>
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Tous les tickets</h1>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un ticket..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Pending">En attente</SelectItem>
                <SelectItem value="In Progress">En cours</SelectItem>
                <SelectItem value="Resolved">Résolu</SelectItem>
                <SelectItem value="Closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredTickets.length === 0 && tickets.length > 0 && (
            <div className="text-center py-10 text-muted-foreground text-lg">Aucun ticket ne correspond à vos filtres.</div>
          )}

          {tickets.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-lg">Aucun ticket trouvé dans le système.</div>
          ) : (
            <div className="grid gap-6">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="relative shadow-lg border-2 border-blue-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                      <Link href={`/ticket/${ticket.id}`} className="hover:underline">
                        {ticket.title}
                      </Link>
                      <TicketStatusBadge status={ticket.status} />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Soumis par {ticket.profiles?.full_name || ticket.profiles?.username || "Inconnu"} le {format(new Date(ticket.created_at), "PPP")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">{ticket.description}</p>
                    {ticket.category && (
                      <p className="text-sm mt-2">
                        Catégorie : <span className="font-medium">{ticket.category}</span>
                      </p>
                    )}
                    <p className="text-sm mt-1">
                      Assigné à : <span className="font-medium">{ticket.assigned_technician?.full_name || ticket.assigned_technician?.username || "Non assigné"}</span>
                    </p>
                    {ticket.status === "Pending" && (
                      <div className="mt-4">
                        <Button
                          size="sm"
                          disabled={assigning === ticket.id}
                          onClick={async () => {
                            setAssigning(ticket.id)
                            const res = await assignTicket(undefined, new FormData(Object.assign(document.createElement('form'), {
                              ticketId: ticket.id,
                              technicianId: currentTechId,
                            })))
                            setTimeout(() => setAssigning(null), 2000)
                            if (res?.error) {
                              toast({ title: "Affectation échouée", description: res.error, variant: "destructive" })
                            } else {
                              toast({ title: "Ticket assigné", description: "Vous êtes maintenant assigné à ce ticket.", variant: "default" })
                            }
                          }}
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          {assigning === ticket.id ? "Affectation..." : "M'assigner ce ticket"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
