"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { updateTicketStatus } from "@/lib/tickets";
import { CheckCircle, Wrench, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useActionState } from "react";
import type { Ticket } from "@/types/database";
import { useIsMobile } from "@/components/ui/use-mobile";
import { useForm } from "react-hook-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ExportImportBar } from "@/components/ui/export-import-bar";
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

// Fix Ticket type to include priority
// If your Ticket type is imported from types/database.ts, update it there as well
// For now, extend it here for local use

type TicketFixed = Ticket & {
  priority?: string | null;
};

export default function TechnicianAssignedTicketsPage() {
  // Bulk actions state
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Bulk status update handler
  async function handleBulkStatusUpdate(newStatus: string) {
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .in("id", selectedTicketIds);
      if (error) {
        toast({ title: "Bulk Update Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Bulk Status Updated", description: `Updated ${selectedTicketIds.length} tickets.`, variant: "default" });
        setSelectedTicketIds([]);
        fetchTicketsRef.current && fetchTicketsRef.current();
      }
    } finally {
      setBulkActionLoading(false);
    }
  }
  const [tickets, setTickets] = useState<TicketFixed[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketFixed[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedTechnician, setSelectedTechnician] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: string; to: string } | null>(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [loading, setLoading] = useState(true);
  const [optimisticTickets, setOptimisticTickets] = useState<Ticket[] | null>(null);
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const fetchTicketsRef = useRef<() => void>(null);
  const isMobile = useIsMobile();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // Static options for filters
  const allCategories = ["Hardware", "Software", "Network", "Other"];
  const allPriorities = ["Low", "Medium", "High", "Critical"];
  const allTechnicians: Array<{ id: string; full_name?: string | null; username?: string | null }> = [];

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      const { data: user, error: userError } = await supabase.auth.getUser();
      console.log("Fetched user:", user);
      if (userError || !user.user) {
        toast({
          title: "Authentication Error",
          description: "Please log in.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.user.id)
        .single();
      console.log("Fetched profile:", profile);

      if (profileError || profile?.role !== "technician") {
        toast({
          title: "Permission Denied",
          description: "You do not have access to this page.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tickets")
        .select(`*, creator:profiles_with_email!tickets_user_id_fkey(full_name, username, email), technician:profiles!tickets_assigned_to_fkey(full_name, username)`)
        .eq("assigned_to", user.user.id)
        .order("created_at", { ascending: false });
      console.log("Fetched tickets:", data);

      if (error) {
        console.error("Error fetching assigned tickets:", error);
        toast({
          title: "Error",
          description: "Failed to load assigned tickets.",
          variant: "destructive",
        });
      } else {
        setTickets(data as Ticket[]);
      }
      setLoading(false);
    }
    fetchTickets();
  }, [supabase, toast]);

  // Update filteredTickets whenever tickets or filters change
  useEffect(() => {
    let filtered = [...tickets];
    if (selectedStatus !== "all") {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    if (selectedPriority !== "all") {
      filtered = filtered.filter((t) => t.priority === selectedPriority);
    }
    if (selectedTechnician !== "all") {
      filtered = filtered.filter((t) => t.assigned_to === selectedTechnician);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter((t) =>
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedDateRange?.from) {
      filtered = filtered.filter((t) => new Date(t.created_at) >= new Date(selectedDateRange.from));
    }
    if (selectedDateRange?.to) {
      filtered = filtered.filter((t) => new Date(t.created_at) <= new Date(selectedDateRange.to));
    }
    // Sort
    if (sortBy === "date-desc") {
      filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "date-asc") {
      filtered = filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "priority-desc") {
      filtered = filtered.sort((a, b) => (b.priority || "").localeCompare(a.priority || ""));
    } else if (sortBy === "priority-asc") {
      filtered = filtered.sort((a, b) => (a.priority || "").localeCompare(b.priority || ""));
    }
    setFilteredTickets(filtered);
  }, [tickets, selectedStatus, selectedCategory, selectedPriority, selectedTechnician, searchTerm, selectedDateRange, sortBy]);

  // --- Helper Component ---
  type StatusUpdateFormProps = {
    ticketId: string
    currentStatus: string
    updateTicketStatus: (prevState: any, formData: FormData) => Promise<any>
    toast: any
    nextStatus: string
    buttonLabel: string
    buttonIcon: React.ReactNode
    buttonClass?: string
    onSuccess?: () => void
    onOptimistic?: (ticketId: string, nextStatus: string) => void
  }
  function StatusUpdateForm(props: StatusUpdateFormProps) {
    const {
      ticketId,
      currentStatus,
      updateTicketStatus,
      toast,
      nextStatus,
      buttonLabel,
      buttonIcon,
      buttonClass,
      onSuccess,
      onOptimistic,
    } = props
    const [state, formAction] = useActionState(async (prev: any, formData: any) => {
      if (onOptimistic) onOptimistic(ticketId, nextStatus)
      return await updateTicketStatus(prev, formData)
    }, undefined)
    useEffect(() => {
      if (state?.error) {
        toast({
          title: "Status Update Failed",
          description: state.error,
          variant: "destructive",
        })
      } else if (state?.success) {
        toast({
          title: "Status Updated",
          description: state.success,
          variant: "default",
        })
        if (onSuccess) onSuccess()
      }
    }, [state, toast, onSuccess])
    return (
      <form action={formAction} className="inline">
        <input type="hidden" name="ticketId" value={ticketId} />
        <input type="hidden" name="newStatus" value={nextStatus} />
        <Button type="submit" size="sm" className={buttonClass} aria-label={buttonLabel}>
          {buttonIcon}
          {buttonLabel}
        </Button>
      </form>
    )
  }

  // --- Comment & Activity Log Helper ---
// Comment type for JSONB comments array
type Comment = {
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
};

function TicketComments({ ticketId, userId }: { ticketId: string; userId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ content: string }>();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  // Fetch comments from ticket.comments JSONB
  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("comments")
        .eq("id", ticketId)
        .single();
      if (error) {
        toast({ title: "Error", description: "Failed to load comments.", variant: "destructive" });
        setComments([]);
      } else {
        setComments(data?.comments || []);
      }
      setLoading(false);
    }
    fetchComments();
    // Optionally, you can add a polling or channel for live updates
    // ...existing code...
  }, [ticketId, supabase, toast]);

  // Add comment to ticket.comments JSONB
  async function onSubmit(data: { content: string }) {
    setLoading(true);
    // Get current user info
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", userId)
      .single();
    const newComment: Comment = {
      user_id: userId,
      content: data.content,
      created_at: new Date().toISOString(),
      user_name: userProfile?.full_name || userProfile?.username || "Unknown",
    };
    // Fetch current comments
    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select("comments")
      .eq("id", ticketId)
      .single();
    const currentComments = ticketData?.comments || [];
    // Update comments array
    const { error } = await supabase
      .from("tickets")
      .update({ comments: [...currentComments, newComment] })
      .eq("id", ticketId);
    if (error) {
      toast({ title: "Error", description: "Failed to add comment.", variant: "destructive" });
    } else {
      reset();
      setComments([...currentComments, newComment]);
    }
    setLoading(false);
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Comments & Activity</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mb-2">
        <input
          {...register("content", { required: true })}
          className="border rounded px-2 py-1 flex-1"
          placeholder="Add a comment..."
          aria-label="Add a comment"
        />
        <Button type="submit" size="sm">Comment</Button>
      </form>
      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <ul className="space-y-2">
          {comments.map((c, idx) => (
            <li key={idx} className="bg-gray-50 rounded p-2">
              <span className="font-medium text-blue-700">{c.user_name}</span>
              <span className="ml-2 text-xs text-gray-500">{format(new Date(c.created_at), "PPP p")}</span>
              <div className="mt-1 text-gray-800">{c.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

  // Ajout du composant pour proposer un tarif
  function ProposePriceForm({ ticket, onPriceProposed }: { ticket: TicketFixed, onPriceProposed: () => void }) {
    const [price, setPrice] = useState(ticket.proposed_price ? String(ticket.proposed_price) : "");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase
        .from("tickets")
        .update({ proposed_price: Number(price), price_status: "proposed" })
        .eq("id", ticket.id);
      setLoading(false);
      if (error) {
        toast({ title: "Erreur", description: "Impossible d'enregistrer le tarif.", variant: "destructive" });
      } else {
        toast({ title: "Tarif proposé", description: "Le tarif a été proposé au client.", variant: "default" });
        onPriceProposed();
      }
    }

    return (
      <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Proposer un tarif (€)"
          className="w-32"
          required
          aria-label="Proposer un tarif"
        />
        <Button type="submit" size="sm" disabled={loading || !price}>
          {loading ? "Envoi..." : ticket.proposed_price ? "Modifier" : "Proposer"}
        </Button>
      </form>
    );
  }

  useEffect(() => {
    setHasMore((optimisticTickets || filteredTickets).length > page * PAGE_SIZE);
  }, [optimisticTickets, filteredTickets, page]);

  const ticketsToRender = (optimisticTickets || filteredTickets).slice(0, page * PAGE_SIZE);

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
              <div tabIndex={0}>Chargement des tickets assignés...</div>
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
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          {/* Bulk Actions Bar */}
          {selectedTicketIds.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-4">
              <span className="font-medium">Actions groupées :</span>
              <Button size="sm" disabled={bulkActionLoading} onClick={() => handleBulkStatusUpdate("Resolved")}>Marquer comme résolu</Button>
              <Button size="sm" disabled={bulkActionLoading} onClick={() => handleBulkStatusUpdate("In Progress")}>Marquer en cours</Button>
              <Button size="sm" variant="outline" disabled={bulkActionLoading} onClick={() => setSelectedTicketIds([])}>Effacer la sélection</Button>
            </div>
          )}
          <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Tickets assignés & en attente</h1>

          {/* AI Assistant Panel */}
          <div className="mb-6">
            {/* The AiAssistant component was removed as per the edit hint. */}
          </div>

          {/* Export/Import Bar */}
          <ExportImportBar filteredTickets={filteredTickets} supabase={supabase} toast={toast} fetchTicketsRef={fetchTicketsRef as any} />

          <div className={isMobile ? "flex flex-col gap-4 mb-6" : "flex flex-col sm:flex-row gap-4 mb-6"}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search tickets..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search tickets"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus} aria-label="Filter by Status">
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} aria-label="Filter by Category">
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((category: string) => (
                  <SelectItem key={category} value={category} aria-label={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority} aria-label="Filter by Priority">
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {allPriorities.map((priority: string) => (
                  <SelectItem key={priority} value={priority} aria-label={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician} aria-label="Filter by Technician">
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {allTechnicians.map((tech: { id: string; full_name?: string | null; username?: string | null }) => (
                  <SelectItem key={tech.id} value={tech.id} aria-label={String(tech.full_name || tech.username || '')}>
                    {tech.full_name || tech.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 items-center">
              <label htmlFor="date-from" className="text-xs text-muted-foreground">From</label>
              <Input
                id="date-from"
                type="date"
                value={selectedDateRange?.from || ""}
                onChange={(e) => setSelectedDateRange((prev) => ({
                  from: e.target.value,
                  to: prev?.to || ""
                }))}
                className="w-[120px]"
                aria-label="Date from"
              />
              <label htmlFor="date-to" className="text-xs text-muted-foreground">To</label>
              <Input
                id="date-to"
                type="date"
                value={selectedDateRange?.to || ""}
                onChange={(e) => setSelectedDateRange((prev) => ({
                  from: prev?.from || "",
                  to: e.target.value
                }))}
                className="w-[120px]"
                aria-label="Date to"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy} aria-label="Sort By">
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="priority-desc">Priority ↓</SelectItem>
                <SelectItem value="priority-asc">Priority ↑</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredTickets.length === 0 && tickets.length > 0 && (
            <div className="text-center py-10 text-muted-foreground text-lg">Aucun ticket ne correspond à vos filtres.</div>
          )}

          {tickets.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-lg mb-4">Aucun ticket actuellement assigné ou en attente.</p>
              <Button asChild>
                <Link href="/technician/all-tickets">Voir tous les tickets</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6" role="list" aria-label="Ticket List">
              {ticketsToRender.map((ticket) => (
                <Card key={ticket.id} className="relative shadow-lg border-2 border-blue-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90" tabIndex={0} aria-label={`Ticket ${ticket.title}`}
                  style={{ outline: 'none', boxShadow: '0 0 0 2px #e5e7eb' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTicketIds.includes(ticket.id)}
                          onChange={(e) => {
                            setSelectedTicketIds((prev) =>
                              e.target.checked
                                ? [...prev, ticket.id]
                                : prev.filter((id) => id !== ticket.id)
                            )
                          }}
                          aria-label={`Select ticket ${ticket.title}`}
                          className="accent-blue-600 h-4 w-4"
                        />
                        <Link href={`/ticket/${ticket.id}`} className="hover:underline" tabIndex={0} aria-label={`View details for ${ticket.title}`}>{ticket.title}</Link>
                      </div>
                      <TicketStatusBadge status={ticket.status} />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {/* Submitter Avatar */}
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={(ticket as any).creator?.avatar_url || "/placeholder-user.jpg"} alt={(ticket as any).creator?.email || (ticket as any).creator?.full_name || (ticket as any).creator?.username || "User"} />
                        <AvatarFallback>
                          {(ticket as any).creator?.email?.[0] || (ticket as any).creator?.full_name?.[0] || (ticket as any).creator?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      Submitted by {(ticket as any).creator?.email || (ticket as any).creator?.full_name || (ticket as any).creator?.username || "Unknown"} on {format(new Date(ticket.created_at), "PPP")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2" tabIndex={0}>{ticket.description}</p>
                    {ticket.category && (
                      <p className="text-sm mt-2" tabIndex={0}>
                        Category: <span className="font-medium" style={{ color: '#2563eb' }}>{ticket.category}</span>
                      </p>
                    )}
                    {(ticket as any).assigned_technician && (
                      <p className="text-sm mt-1 flex items-center gap-2" tabIndex={0}>
                        {/* Technician Avatar */}
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={(ticket as any).assigned_technician.avatar_url || "/placeholder-user.jpg"} alt={(ticket as any).assigned_technician.full_name || (ticket as any).assigned_technician.username || "Technician"} />
                          <AvatarFallback>
                            {(ticket as any).assigned_technician.full_name?.[0] || (ticket as any).assigned_technician.username?.[0] || "T"}
                          </AvatarFallback>
                        </Avatar>
                        Assigned to: <span className="font-medium" style={{ color: '#059669' }}>{(ticket as any).assigned_technician.full_name || (ticket as any).assigned_technician.username}</span>
                      </p>
                    )}
                    <div className="mt-4 flex gap-2" role="group" aria-label="Ticket Actions">
                      {ticket.status === "In Progress" && (
                        <StatusUpdateForm
                          ticketId={ticket.id}
                          currentStatus={ticket.status}
                          updateTicketStatus={updateTicketStatus}
                          toast={toast}
                          nextStatus="Resolved"
                          buttonLabel="Mark as Resolved"
                          buttonIcon={<CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />}
                          buttonClass="bg-green-500 hover:bg-green-600"
                          onSuccess={() => fetchTicketsRef.current && fetchTicketsRef.current()}
                          // onOptimistic={handleOptimisticStatusUpdate} // Remove or define if needed
                        />
                      )}
                      {ticket.status === "Pending" && (
                        <StatusUpdateForm
                          ticketId={ticket.id}
                          currentStatus={ticket.status}
                          updateTicketStatus={updateTicketStatus}
                          toast={toast}
                          nextStatus="In Progress"
                          buttonLabel="Take Ticket"
                          buttonIcon={<Wrench className="h-4 w-4 mr-2" aria-hidden="true" />}
                          onSuccess={() => fetchTicketsRef.current && fetchTicketsRef.current()}
                          // onOptimistic={handleOptimisticStatusUpdate} // Remove or define if needed
                        />
                      )}
                    </div>
                    {/* Bloc Proposer un tarif */}
                    {(!ticket.proposed_price || ticket.price_status === "refused") && (
                      <ProposePriceForm ticket={ticket} onPriceProposed={() => fetchTicketsRef.current && fetchTicketsRef.current()} />
                    )}
                    {/* Affichage du tarif proposé */}
                    {ticket.proposed_price && ticket.price_status !== "refused" && (
                      <div className="mt-2 text-sm">
                        <span className="font-semibold">Tarif proposé :</span> <span className="text-blue-700 font-bold">{ticket.proposed_price} €</span>
                        <span className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">{ticket.price_status === "proposed" ? "En attente client" : ticket.price_status === "accepted" ? "Accepté" : ticket.price_status === "paid" ? "Payé" : ticket.price_status === "refused" ? "Refusé" : ""}</span>
                      </div>
                    )}
                    <TicketComments ticketId={ticket.id} userId={""} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button onClick={() => setPage((p) => p + 1)} aria-label="Charger plus de tickets">
                Charger plus
              </Button>
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
  );
}
