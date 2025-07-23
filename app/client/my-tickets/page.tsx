"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React, { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { ExportImportBar } from "@/components/ui/export-import-bar"
import { Search } from "lucide-react"
import type { Ticket as BaseTicket } from "@/types/database"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

type Technician = { full_name?: string; username?: string }
type Ticket = BaseTicket & {
  assigned_technician?: Technician | null
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      setErrorMsg(null)
      const { data: user, error: userError } = await supabase.auth.getUser()
      if (userError || !user.user) {
        setErrorMsg("Please log in to view your tickets.")
        toast({
          title: "Authentication Error",
          description: "Please log in to view your tickets.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from("tickets")
        .select(`*, profiles!tickets_user_id_fkey(full_name, username), assigned_technician:profiles!tickets_assigned_to_fkey(full_name, username)`)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
      if (error) {
        setErrorMsg("Failed to load your tickets. " + error.message)
        toast({
          title: "Error",
          description: "Failed to load your tickets.",
          variant: "destructive",
        })
      } else {
        setTickets(data as Ticket[])
      }
      setLoading(false)
    }
    fetchTickets()
    const channel = supabase
      .channel("my-tickets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, (payload: any) => {
        // Only refetch if the ticket is relevant to the current user
        fetchTickets()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast])

  useEffect(() => {
    // Memoized filtering for performance
    setFilteredTickets(
      tickets.filter((ticket) => {
        const matchesSearch = searchTerm
          ? ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
          : true
        const matchesStatus = selectedStatus === "all" || ticket.status === selectedStatus
        const matchesCategory = selectedCategory === "all" || ticket.category === selectedCategory
        return matchesSearch && matchesStatus && matchesCategory
      })
    )
  }, [tickets, searchTerm, selectedStatus, selectedCategory])

  const allCategories = Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean) as string[]

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        
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
  if (errorMsg) {
    return (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="flex flex-col items-center justify-center py-10 text-red-600" role="alert" aria-live="assertive">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p tabIndex={0}>{errorMsg}</p>
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

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          <header className="mb-6">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Mes tickets</h1>
          </header>

          {/* Export/Import Bar */}
          <ExportImportBar filteredTickets={filteredTickets} supabase={supabase} toast={toast} fetchTicketsRef={{ current: () => { /* refetch not needed for client */ } }} />

          <section aria-label="Ticket Filters" className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Rechercher un ticket..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Rechercher un ticket"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrer par statut">
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
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrer par catégorie">
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
          </section>

          <section aria-label="Ticket List">
            {filteredTickets.length === 0 && tickets.length > 0 && (
              <div className="text-center py-10 text-muted-foreground text-lg" role="status" aria-live="polite">Aucun ticket ne correspond à vos filtres.</div>
            )}

            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10" role="status" aria-live="polite">
                <svg width="80" height="80" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-4"><rect x="4" y="4" width="16" height="16" rx="4" fill="#f3f4f6"/><path d="M8 12h8M8 16h4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/></svg>
                <p className="text-muted-foreground text-lg mb-4" tabIndex={0}>Vous n'avez pas encore soumis de ticket.</p>
                <Button asChild autoFocus>
                  <Link href="/client/submit-ticket" tabIndex={0} aria-label="Soumettre votre premier ticket">Soumettre mon premier ticket</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="relative shadow-lg border-2 border-blue-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90" role="region" aria-label={`Ticket ${ticket.title}`}> 
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                        <Link href={`/ticket/${ticket.id}`} className="hover:underline" aria-label={`Voir les détails du ticket ${ticket.title}`}> 
                          {ticket.title}
                        </Link>
                        <TicketStatusBadge status={ticket.status} />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Soumis le {format(new Date(ticket.created_at), "PPP")}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">{ticket.description}</p>
                      {ticket.category && (
                        <p className="text-sm mt-2">
                          Catégorie : <span className="font-medium">{ticket.category}</span>
                        </p>
                      )}
                      {ticket.assigned_technician && (
                        <p className="text-sm mt-1">
                          Assigné à : {" "}
                          <span className="font-medium">
                            {ticket.assigned_technician.full_name || ticket.assigned_technician.username}
                          </span>
                        </p>
                      )}
                      {/* Bloc tarif proposé et actions client */}
                      <TarifActions ticket={ticket} onAction={() => window.location.reload()} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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

// Ajout du composant pour accepter/refuser/payer un tarif
function TarifActions({ ticket, onAction }: { ticket: Ticket, onAction: () => void }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  async function handleAccept() {
    setLoading(true);
    const { error } = await supabase
      .from("tickets")
      .update({ price_status: "accepted" })
      .eq("id", ticket.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'accepter le tarif.", variant: "destructive" });
    } else {
      toast({ title: "Tarif accepté", description: "Vous avez accepté le tarif. Vous pouvez maintenant payer.", variant: "default" });
      onAction();
    }
  }
  async function handleRefuse() {
    setLoading(true);
    const { error } = await supabase
      .from("tickets")
      .update({ price_status: "refused" })
      .eq("id", ticket.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de refuser le tarif.", variant: "destructive" });
    } else {
      toast({ title: "Tarif refusé", description: "Vous avez refusé le tarif. Le technicien sera notifié.", variant: "default" });
      onAction();
    }
  }
  async function handlePay() {
    setLoading(true);
    // Crée une transaction et marque le ticket comme payé
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        ticket_id: ticket.id,
        client_id: ticket.user_id,
        technician_id: ticket.assigned_to,
        amount: ticket.proposed_price,
        status: "paid",
        paid_at: new Date().toISOString(),
      });
    if (txError) {
      setLoading(false);
      toast({ title: "Erreur", description: "Paiement échoué.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("tickets")
      .update({ price_status: "paid", payment_date: new Date().toISOString() })
      .eq("id", ticket.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de marquer comme payé.", variant: "destructive" });
    } else {
      toast({ title: "Paiement effectué", description: "Le technicien sera notifié.", variant: "default" });
      onAction();
    }
  }

  if (!ticket.proposed_price) return null;
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div>
        <span className="font-semibold">Tarif proposé :</span> <span className="text-blue-700 font-bold">{ticket.proposed_price} €</span>
        <span className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">{ticket.price_status === "proposed" ? "En attente de votre décision" : ticket.price_status === "accepted" ? "Accepté, à payer" : ticket.price_status === "paid" ? "Payé" : ticket.price_status === "refused" ? "Refusé" : ""}</span>
      </div>
      {ticket.price_status === "proposed" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAccept} disabled={loading}>Accepter</Button>
          <Button size="sm" variant="outline" onClick={handleRefuse} disabled={loading}>Refuser</Button>
        </div>
      )}
      {ticket.price_status === "accepted" && (
        <Button size="sm" onClick={handlePay} disabled={loading}>Payer</Button>
      )}
      {ticket.price_status === "paid" && (
        <span className="text-green-600 font-semibold">Paiement effectué le {ticket.payment_date ? format(new Date(ticket.payment_date), "PPP") : ""}</span>
      )}
      {ticket.price_status === "refused" && (
        <span className="text-red-600 font-semibold">Tarif refusé. En attente d'une nouvelle proposition.</span>
      )}
    </div>
  );
}
