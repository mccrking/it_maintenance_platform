"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { categorizeTicket } from "./ai"

export async function createTicket(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string | null
  const attachmentFile = formData.get("attachment") as File | null

  if (!title || !description) {
    return { error: "Title and description are required." }
  }

  let attachmentUrl: string | null = null
  if (attachmentFile && attachmentFile.size > 0) {
    const filePath = `${user.id}/${Date.now()}-${attachmentFile.name}`
    const { data, error: uploadError } = await supabase.storage
      .from("ticket-attachments")
      .upload(filePath, attachmentFile, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading attachment:", uploadError)
      return { error: "Failed to upload attachment." }
    }
    attachmentUrl = data?.path
      ? supabase.storage.from("ticket-attachments").getPublicUrl(data.path).data.publicUrl
      : null
  }

  // Intelligent categorization
  const category = await categorizeTicket(title, description)

  // Insert ticket with priority if the column exists, otherwise ignore
  const ticketData: any = {
    user_id: user.id,
    title,
    description,
    category,
    status: "Pending",
    attachment_url: attachmentUrl,
  }
  if (priority) ticketData.priority = priority

  const { error } = await supabase.from("tickets").insert(ticketData)

  if (error) {
    console.error("Error creating ticket:", error)
    return { error: "Failed to create ticket." }
  }

  revalidatePath("/client/my-tickets")
  return { success: true }
}

export async function updateTicketStatus(prevState: any, formData: FormData) {
  if (!formData || typeof formData.get !== "function") {
    return { error: "Invalid form submission. Please try again." };
  }
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const ticketId = formData.get("ticketId") as string;
  const newStatus = formData.get("newStatus") as string;

  // In a real app, you'd check if the user has permission (technician/admin)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || (profile?.role !== "technician" && profile?.role !== "admin")) {
    return { error: "Permission denied." }
  }

  const { error } = await supabase.from("tickets").update({ status: newStatus }).eq("id", ticketId)

  if (error) {
    console.error("Error updating ticket status:", error)
    return { error: "Failed to update ticket status." }
  }

  revalidatePath("/technician/assigned-tickets")
  revalidatePath("/admin/tickets")
  revalidatePath(`/ticket/${ticketId}`)
  return { success: true }
}

export async function assignTicket(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized: user not authenticated." };
  }

  // Input validation: UUID format (basic check)
  const ticketId = formData.get("ticketId") as string | null;
  const technicianId = formData.get("technicianId") as string | null;
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  if (!ticketId || !uuidRegex.test(ticketId)) {
    return { error: "Invalid or missing ticket ID." };
  }
  if (!technicianId) {
    return { error: "Missing technician ID." };
  }
  if (technicianId !== "unassign" && !uuidRegex.test(technicianId)) {
    return { error: "Invalid technician ID." };
  }

  // Permission check: only admin can assign
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(`Error fetching user profile for assignTicket (user: ${user.id}, ticket: ${ticketId}):`, profileError);
    return { error: "Failed to verify user permissions." };
  }
  if (!profile || profile.role !== "admin") {
    return { error: "Permission denied. Only admins can assign tickets." };
  }

  // Check ticket exists before updating
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .maybeSingle();
  if (ticketError) {
    console.error(`Error checking ticket existence (ticket: ${ticketId}):`, ticketError);
    return { error: "Failed to verify ticket existence." };
  }
  if (!ticket) {
    return { error: "Ticket not found." };
  }

  // Only assign to real technicians or unassign
  if (technicianId !== "unassign") {
    const { data: tech, error: techError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", technicianId)
      .eq("role", "technician")
      .maybeSingle();
    if (techError) {
      console.error(`Error verifying technician (tech: ${technicianId}):`, techError);
      return { error: "Failed to verify technician." };
    }
    if (!tech) {
      return { error: "Technician not found or not a technician." };
    }
  }

  const assignedTo = technicianId === "unassign" ? null : technicianId;
  const newStatus = assignedTo ? "In Progress" : "Pending";

  const { error } = await supabase
    .from("tickets")
    .update({ assigned_to: assignedTo, status: newStatus })
    .eq("id", ticketId);

  if (error) {
    console.error(`Error assigning ticket (ticket: ${ticketId}, tech: ${technicianId}, user: ${user.id}):`, error);
    return { error: "Failed to assign ticket. Please try again later." };
  }

  revalidatePath("/admin/tickets");
  revalidatePath("/technician/assigned-tickets");
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true };
}

export async function addTicketComment(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized: user not authenticated." }
  }

  const ticketId = formData.get("ticketId") as string | null
  const comment = formData.get("comment") as string | null

  if (!ticketId) {
    return { error: "Missing ticket ID." }
  }
  if (!comment || comment.trim().length === 0) {
    return { error: "Comment cannot be empty." }
  }

  const { data: existingTicket, error: fetchError } = await supabase
    .from("tickets")
    .select("comments")
    .eq("id", ticketId)
    .single()

  if (fetchError) {
    console.error("Error fetching ticket for comment:", fetchError)
    return { error: "Failed to fetch ticket for comment." }
  }
  if (!existingTicket) {
    return { error: "Ticket not found." }
  }

  const currentComments = (existingTicket.comments || []) as { user_id: string; comment: string; created_at: string }[]
  const newComment = {
    user_id: user.id,
    comment,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from("tickets")
    .update({ comments: [...currentComments, newComment] })
    .eq("id", ticketId)

  if (error) {
    console.error("Error adding comment:", error)
    return { error: "Failed to add comment. Please try again later." }
  }

  revalidatePath(`/ticket/${ticketId}`)
  revalidatePath("/client/my-tickets")
  revalidatePath("/technician/assigned-tickets")
  revalidatePath("/admin/tickets")
  return { success: true }
}

export async function addTicketSolution(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized: user not authenticated." }
  }

  const ticketId = formData.get("ticketId") as string | null
  const solution = formData.get("solution") as string | null

  if (!ticketId) {
    return { error: "Missing ticket ID." }
  }
  if (!solution || solution.trim().length === 0) {
    return { error: "Solution cannot be empty." }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Error fetching user profile for addTicketSolution:", profileError)
    return { error: "Failed to verify user permissions." }
  }
  if (!profile || (profile.role !== "technician" && profile.role !== "admin")) {
    return { error: "Permission denied. Only technicians or admins can add solutions." }
  }

  const { error } = await supabase.from("tickets").update({ solution, status: "Resolved" }).eq("id", ticketId)

  if (error) {
    console.error("Error adding solution:", error)
    return { error: "Failed to add solution. Please try again later." }
  }

  revalidatePath(`/ticket/${ticketId}`)
  revalidatePath("/technician/assigned-tickets")
  revalidatePath("/admin/tickets")
  return { success: true }
}

export async function getTicketDetails(ticketId: string) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      profiles!tickets_user_id_fkey(full_name, username),
      assigned_technician:profiles!tickets_assigned_to_fkey(full_name, username)
    `,
    )
    .eq("id", ticketId)
    .single()

  if (error) {
    console.error("Error fetching ticket details:", error)
    return null
  }

  return ticket
}

export async function getAllTicketsForUser(userId: string) {
  const supabase = await getSupabaseServerClient()
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      profiles!tickets_user_id_fkey(full_name, username),
      assigned_technician:profiles!tickets_assigned_to_fkey(full_name, username)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user tickets:", error)
    return []
  }
  return tickets
}

export async function getAllTicketsForTechnician(technicianId: string) {
  const supabase = await getSupabaseServerClient()
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      profiles!tickets_user_id_fkey(full_name, username),
      assigned_technician:profiles!tickets_assigned_to_fkey(full_name, username)
    `,
    )
    .or(`assigned_to.eq.${technicianId},status.eq.Pending`) // Assigned to them OR Pending
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching technician tickets:", error)
    return []
  }
  return tickets
}

export async function getAllTicketsForAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      profiles!tickets_user_id_fkey(full_name, username),
      assigned_technician:profiles!tickets_assigned_to_fkey(full_name, username)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching admin tickets:", error)
    return []
  }
  return tickets
}

export async function getAllTechnicians() {
  const supabase = await getSupabaseServerClient()
  const { data: technicians, error } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("role", "technician")

  if (error) {
    console.error("Error fetching technicians:", error)
    return []
  }
  return technicians
}
