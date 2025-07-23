import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createTicket } from "../tickets";

export interface Diagnostic {
  type: string;
  description: string;
  userId: string;
  date: string;
  status?: string;
}

export async function saveDiagnostic(diagnostic: Diagnostic) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("diagnostics").insert({
    type: diagnostic.type,
    description: diagnostic.description,
    user_id: diagnostic.userId,
    date: diagnostic.date,
    status: diagnostic.status || "En attente",
  });
  if (error) {
    return { error: "Erreur lors de l’enregistrement du diagnostic." };
  }
  return { success: true };
}

export async function getDiagnostics() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("diagnostics").select("*")
    .order("date", { ascending: false });
  if (error) {
    return [];
  }
  return data || [];
}

export async function createTicketFromDiagnostic(_: any, diagnostic: Diagnostic) {
  const formData = new FormData();
  formData.set("title", `Ticket automatique - ${diagnostic.type}`);
  formData.set("description", diagnostic.description);
  formData.set("priority", "Normal");
  // Ajoute d’autres champs si nécessaire
  return await createTicket(null, formData);
}
