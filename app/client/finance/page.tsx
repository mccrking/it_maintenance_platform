"use client"
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Invoice {
  id: number;
  amount: number;
  status: string;
  date: string;
}
interface Quote {
  id: number;
  amount: number;
  status: string;
  date: string;
}

export default function ClientFinancePage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user.user) return;
      // Tickets avec un tarif proposé mais non payé
      const { data: quoteTickets } = await supabase
        .from("tickets")
        .select("id, title, proposed_price, price_status, created_at")
        .eq("user_id", user.user.id)
        .in("price_status", ["proposed", "accepted", "refused"]);
      setQuotes(quoteTickets || []);
      // Tickets payés = factures
      const { data: paidTickets } = await supabase
        .from("tickets")
        .select("id, title, proposed_price, payment_date")
        .eq("user_id", user.user.id)
        .eq("price_status", "paid");
      setInvoices(paidTickets || []);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  function handleDownload(id: string) {
    toast({ title: "Téléchargement", description: `Téléchargement de la facture #${id} (simulation)` });
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mes devis et factures</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Devis</h2>
        <table className="w-full border mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Titre</th>
              <th className="p-2">Montant</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(q => (
              <tr key={q.id} className="border-b">
                <td className="p-2">{q.title}</td>
                <td className="p-2">{q.proposed_price} €</td>
                <td className="p-2">{q.price_status === "proposed" ? "En attente" : q.price_status === "accepted" ? "Accepté" : q.price_status === "refused" ? "Refusé" : q.price_status}</td>
                <td className="p-2">{q.created_at ? format(new Date(q.created_at), "PPP") : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Factures</h2>
        <table className="w-full border mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Titre</th>
              <th className="p-2">Montant</th>
              <th className="p-2">Date de paiement</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(f => (
              <tr key={f.id} className="border-b">
                <td className="p-2">{f.title}</td>
                <td className="p-2">{f.proposed_price} €</td>
                <td className="p-2">{f.payment_date ? format(new Date(f.payment_date), "PPP") : ""}</td>
                <td className="p-2">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(f.id)}>Télécharger</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
