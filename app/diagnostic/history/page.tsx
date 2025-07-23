"use client"
import { useState, useEffect } from "react";
import { createTicketFromDiagnostic, getDiagnostics } from "@/lib/actions/diagnostic-tickets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DiagnosticHistoryPage() {
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeDiag, setActiveDiag] = useState<number|null>(null);
  const [userId, setUserId] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    async function fetchUserAndDiagnostics() {
      setLoading(true);
      setError("");
      const supabase = getSupabaseBrowserClient();
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data?.user?.id) {
        setError("Erreur d'authentification. Veuillez vous connecter.");
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      try {
        const allDiagnostics = await getDiagnostics();
        const userDiagnostics = allDiagnostics.filter((diag: any) => diag.user_id === data.user.id);
        setDiagnostics(userDiagnostics);
      } catch (err) {
        setError("Erreur lors du chargement des diagnostics.");
      }
      setLoading(false);
    }
    fetchUserAndDiagnostics();
  }, []);

  async function handleCreateTicket(diagnostic: any) {
    setActiveDiag(diagnostic.id);
    setMessage("Création du ticket en cours...");
    const result = await createTicketFromDiagnostic(null, diagnostic);
    if (result?.success) {
      setMessage("Ticket de maintenance créé avec succès !");
    } else {
      setMessage("Erreur lors de la création du ticket.");
    }
    setTimeout(() => {
      setMessage("");
      setActiveDiag(null);
    }, 3000);
  }

  // Filtrage des diagnostics selon les sélections
  const filteredDiagnostics = diagnostics.filter((diag) => {
    const typeMatch = filterType ? diag.type === filterType : true;
    const statusMatch = filterStatus ? diag.status === filterStatus : true;
    return typeMatch && statusMatch;
  });

  return (
    <main className="p-8 max-w-2xl mx-auto" aria-label="Page d’historique des diagnostics">
      <h1 className="text-3xl font-bold mb-4" tabIndex={0}>Historique des diagnostics</h1>
      <p className="mb-6" tabIndex={0}>Retrouvez ici la liste de tous vos diagnostics réalisés, avec la possibilité de consulter les détails et de créer un ticket de maintenance à partir d’un diagnostic.</p>
      <section className="mb-6 flex gap-4 items-center">
        <label htmlFor="filterType">Filtrer par type&nbsp;:</label>
        <select id="filterType" value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2 border rounded">
          <option value="">Tous</option>
          <option value="hardware">Matériel</option>
          <option value="software">Logiciel</option>
          <option value="network">Réseau</option>
          <option value="other">Autre</option>
        </select>
        <label htmlFor="filterStatus">Filtrer par statut&nbsp;:</label>
        <select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 border rounded">
          <option value="">Tous</option>
          <option value="En attente">En attente</option>
          <option value="Résolu">Résolu</option>
        </select>
      </section>
      <section>
        {loading ? (
          <div aria-live="polite">Chargement des diagnostics...</div>
        ) : error ? (
          <div className="text-red-600" aria-live="polite">{error}</div>
        ) : (
          <ul aria-label="Liste des diagnostics" className="space-y-4" role="list">
            {filteredDiagnostics.length === 0 ? (
              <li className="text-gray-600">Aucun diagnostic enregistré.</li>
            ) : filteredDiagnostics.map((diag) => (
              <li key={diag.id} className="bg-white p-4 rounded shadow" role="listitem" aria-label={`Diagnostic du ${diag.date}, problème ${diag.type}, statut ${diag.status}`}>
                <div className="font-semibold text-black dark:text-black" tabIndex={0}>Diagnostic du {diag.date}</div>
                <div className="text-sm text-gray-700 dark:text-gray-700" tabIndex={0}>Problème détecté&nbsp;: {diag.type}</div>
                <div className="text-sm text-gray-700 dark:text-gray-700" tabIndex={0}>Statut&nbsp;: {diag.status}</div>
                <div className="text-sm mb-2 text-gray-700 dark:text-gray-700" tabIndex={0}>Description&nbsp;: {diag.description}</div>
                <button className="mt-2 bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleCreateTicket(diag)} aria-label="Créer un ticket de maintenance à partir de ce diagnostic">Créer un ticket de maintenance</button>
                {activeDiag === diag.id && message && <div className="mt-2 text-green-700 dark:text-green-400" aria-live="polite">{message}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
