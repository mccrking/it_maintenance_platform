"use client";

import { useState, useEffect, useRef, useActionState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Profile } from "@/types/database";
import { assignTicket, updateTicketStatus } from "@/lib/tickets";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

export default function AdminTicketsPage() {
  // --- State and hooks ---
  type TicketWithJoins = Ticket & {
    creator?: Profile;
    technician?: Profile;
  };
  const [tickets, setTickets] = useState<TicketWithJoins[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketWithJoins[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const allCategories = useRef<string[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  // --- Helper Components ---
  function StatusUpdateForm(props: {
    ticketId: string;
    currentStatus: string;
    updateTicketStatus: (prevState: any, formData: FormData) => Promise<any>;
    toast: any;
    closeOnly?: boolean;
  }) {
    const { ticketId, currentStatus, updateTicketStatus, toast, closeOnly } = props;
    const [state, formAction] = useActionState(updateTicketStatus, undefined);
    useEffect(() => {
      if (state?.error) {
        toast({ title: "Status Update Failed", description: state.error, variant: "destructive" });
      } else if (state?.success) {
        toast({ title: "Status Updated", description: "Ticket status updated successfully.", variant: "success" });
      }
    }, [state, toast]);
    return (
      <form action={formAction}>
        <input type="hidden" name="ticketId" value={ticketId} />
        <input type="hidden" name="newStatus" value={closeOnly ? "Closed" : currentStatus === "Pending" ? "In Progress" : "Resolved"} />
        <Button type="submit" size="sm" variant={closeOnly ? "destructive" : currentStatus === "Pending" ? "default" : "secondary"}>
          {closeOnly ? "Close Ticket" : currentStatus === "Pending" ? "Start Progress" : "Mark Resolved"}
        </Button>
      </form>
    );
  }

  function AssignTechnicianForm(props: {
    ticketId: string;
    assignedTo: string | null;
    technicians: Profile[];
    assignTicket: (prevState: any, formData: FormData) => Promise<any>;
    toast: any;
  }) {
    const { ticketId, assignedTo, technicians, assignTicket, toast } = props;
    const [state, formAction] = useActionState(assignTicket, undefined);
    useEffect(() => {
      if (state?.error) {
        toast({ title: "Assignment Failed", description: state.error, variant: "destructive" });
      } else if (state?.success) {
        toast({ title: "Technician Assigned", description: "Ticket updated successfully.", variant: "success" });
      }
    }, [state, toast]);
    return (
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <Select name="technicianId" defaultValue={assignedTo || "unassign"} required>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Assign Technician" />
          </SelectTrigger>
          <SelectContent>
            {technicians?.map((tech) => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.full_name || tech.username}
              </SelectItem>
            ))}
            <SelectItem value="unassign">Unassign</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm">Assign</Button>
      </form>
    );
  }

  // --- Data fetching and filtering ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user.user) {
        toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { data: ticketsData } = await supabase.from("tickets").select(`*, creator:profiles!tickets_user_id_fkey(*), technician:profiles!tickets_assigned_to_fkey(*)`);
      setTickets(ticketsData || []);
      setFilteredTickets(ticketsData || []);
      const { data: techsData } = await supabase.from("profiles").select("*").eq("role", "technician");
      setTechnicians(techsData || []);
      const categories = [...new Set((ticketsData || []).map((t: Ticket) => typeof t.category === "string" ? t.category : String(t.category)).filter((c: string) => !!c))];
      allCategories.current = categories as string[];
      setLoading(false);
    }
    fetchData();
    const ticketChannel = supabase
      .channel('tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(ticketChannel); };
  }, [supabase, toast]);

  useEffect(() => {
    let filtered = [...tickets];
    if (selectedStatus !== "all") {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term)
      );
    }
    setFilteredTickets(filtered);
  }, [tickets, selectedStatus, selectedCategory, searchTerm]);

  // --- CSV Export/Import ---
  function handleExportCSV() {
    const headers = ["ID", "Title", "Description", "Status", "Category", "Created At"];
    const rows = filteredTickets.map(t => [t.id, t.title, t.description, t.status, t.category, t.created_at]);
    const csv = [headers.join(","), ...rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tickets.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleExportPDF() {
    const { exportTicketsToPDF } = await import("@/lib/pdf-export");
    await exportTicketsToPDF(filteredTickets, "Tickets Report", "technician");
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [header, ...rows] = lines;
      const columns = header.split(",");
      for (const row of rows) {
        const values = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));
        const ticket: any = {};
        columns.forEach((col, i) => { ticket[col.trim().toLowerCase().replace(/ /g, "_")] = values[i]; });
        const { error } = await supabase.from("tickets").insert({
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          category: ticket.category,
          assigned_to: ticket.assigned_to || null,
          created_at: ticket.created_at || new Date().toISOString()
        });
        if (error) throw error;
      }
      toast({ title: "Import Complete", description: `Imported ${rows.length} tickets.`, variant: "default" });
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
    if (importRef.current) importRef.current.value = "";
  }

  // --- Main render logic ---
  let content;
  if (loading) {
    content = (
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
    );
  } else if (filteredTickets.length === 0 && tickets.length > 0) {
    content = (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-6 right-8 z-20">
          <ThemeSwitcher />
        </div>
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="text-center py-10 text-muted-foreground text-lg">Aucun ticket ne correspond à vos filtres.</div>
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
    );
  } else if (tickets.length === 0) {
    content = (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="text-center py-10 text-muted-foreground text-lg">Aucun ticket trouvé dans le système.</div>
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
    );
  } else {
    content = (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
       
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
          <main className="flex-1 w-full py-8">
            <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Gérer tous les tickets</h1>
            <div className="mb-6 flex gap-4 items-center">
              <Button size="sm" variant="outline" onClick={handleExportCSV}>Exporter CSV</Button>
              <Button size="sm" variant="outline" onClick={handleExportPDF}>Exporter PDF</Button>
              <label className="text-sm font-medium">Importer CSV :</label>
              <input
                type="file"
                accept=".csv"
                ref={importRef}
                onChange={handleImportCSV}
                className="border rounded px-2 py-1"
                style={{ maxWidth: 200 }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  {allCategories.current.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-6">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="relative shadow-lg border-2 border-blue-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                      <Link href={`/ticket/${ticket.id}`} className="hover:underline">{ticket.title}</Link>
                      <TicketStatusBadge status={ticket.status} />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.creator?.avatar_url || "/placeholder-user.jpg"} alt={ticket.creator?.full_name || ticket.creator?.username || "User"} />
                        <AvatarFallback>{ticket.creator?.full_name?.[0] || ticket.creator?.username?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      Soumis par {ticket.creator?.full_name || ticket.creator?.username || "Inconnu"} le {format(new Date(ticket.created_at), "PPP")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">{ticket.description}</p>
                    {ticket.category && (
                      <p className="text-sm mt-2">Catégorie: <span className="font-medium">{ticket.category}</span></p>
                    )}
                    <p className="text-sm mt-1 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.technician?.avatar_url || "/placeholder-user.jpg"} alt={ticket.technician?.full_name || ticket.technician?.username || "Technicien"} />
                        <AvatarFallback>{ticket.technician?.full_name?.[0] || ticket.technician?.username?.[0] || "T"}</AvatarFallback>
                      </Avatar>
                      Affecté à: <span className="font-medium">{ticket.technician ? (ticket.technician.full_name || ticket.technician.username) : "Non affecté"}</span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      {ticket.status !== "Closed" && (
                        <StatusUpdateForm
                          ticketId={ticket.id}
                          currentStatus={ticket.status}
                          updateTicketStatus={updateTicketStatus}
                          toast={toast}
                        />
                      )}
                      {ticket.status === "Resolved" && (
                        <StatusUpdateForm
                          ticketId={ticket.id}
                          currentStatus={ticket.status}
                          updateTicketStatus={updateTicketStatus}
                          toast={toast}
                          closeOnly
                        />
                      )}
                      <AssignTechnicianForm
                        ticketId={ticket.id}
                        assignedTo={ticket.assigned_to}
                        technicians={technicians}
                        assignTicket={assignTicket}
                        toast={toast}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
    );
  }
  return content;
}
