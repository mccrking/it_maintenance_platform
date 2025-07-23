"use client"
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface Invoice {
  id: number;
  client: string;
  amount: number;
  status: string;
  date: string;
}
interface Quote {
  id: number;
  client: string;
  amount: number;
  status: string;
  date: string;
}

export default function AdminFinancePage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; avg: number; topTech: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Devis = tickets avec tarif proposé, non payé
      const { data: quoteTickets } = await supabase
        .from("tickets")
        .select("id, title, user_id, proposed_price, price_status, created_at, profiles:profiles!tickets_user_id_fkey(full_name, username)")
        .in("price_status", ["proposed", "accepted", "refused"]);
      setQuotes(quoteTickets || []);
      // Factures = tickets payés
      const { data: paidTickets } = await supabase
        .from("tickets")
        .select("id, title, user_id, proposed_price, payment_date, profiles:profiles!tickets_user_id_fkey(full_name, username)")
        .eq("price_status", "paid");
      setInvoices(paidTickets || []);
      // Statistiques globales
      let total = 0, count = 0;
      let techMap: Record<string, number> = {};
      if (paidTickets) {
        paidTickets.forEach((t: any) => {
          total += t.proposed_price || 0;
          count++;
          if (t.assigned_to) techMap[t.assigned_to] = (techMap[t.assigned_to] || 0) + (t.proposed_price || 0);
        });
      }
      let topTech = "-";
      if (Object.keys(techMap).length > 0) {
        const top = Object.entries(techMap).sort((a, b) => b[1] - a[1])[0];
        if (top) {
          // Récupère le nom du technicien
          const { data: tech } = await supabase.from("profiles").select("full_name, username").eq("id", top[0]).single();
          topTech = tech?.full_name || tech?.username || top[0];
        }
      }
      setStats({ total, avg: count ? total / count : 0, topTech });
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion financière</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Devis</h2>
        <table className="w-full border mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Client</th>
              <th className="p-2">Titre</th>
              <th className="p-2">Montant</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(q => (
              <tr key={q.id} className="border-b">
                <td className="p-2">{q.profiles?.full_name || q.profiles?.username || q.user_id}</td>
                <td className="p-2">{q.title}</td>
                <td className="p-2">{q.proposed_price} €</td>
                <td className="p-2">{q.price_status === "proposed" ? "En attente" : q.price_status === "accepted" ? "Accepté" : q.price_status === "refused" ? "Refusé" : q.price_status}</td>
                <td className="p-2">{q.created_at ? format(new Date(q.created_at), "PPP") : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Factures</h2>
        <table className="w-full border mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Client</th>
              <th className="p-2">Titre</th>
              <th className="p-2">Montant</th>
              <th className="p-2">Date de paiement</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(f => (
              <tr key={f.id} className="border-b">
                <td className="p-2">{f.profiles?.full_name || f.profiles?.username || f.user_id}</td>
                <td className="p-2">{f.title}</td>
                <td className="p-2">{f.proposed_price} €</td>
                <td className="p-2">{f.payment_date ? format(new Date(f.payment_date), "PPP") : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Suivi budgétaire</h2>
        <div className="bg-gray-50 p-4 rounded shadow">
          <p>Total encaissé&nbsp;: <strong>{stats ? stats.total.toFixed(2) : "-"} €</strong></p>
          <p>Coût moyen par intervention&nbsp;: <strong>{stats ? stats.avg.toFixed(2) : "-"} €</strong></p>
          <p>Technicien le plus sollicité&nbsp;: <strong>{stats ? stats.topTech : "-"}</strong></p>
        </div>
      </section>
    </main>
  );
}
