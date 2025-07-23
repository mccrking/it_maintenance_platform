"use client"
import AiAssistant from "../../components/ui/ai-assistant";
import { useState } from "react";
import { saveDiagnostic, createTicketFromDiagnostic } from "../../lib/actions/diagnostic-tickets";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export default function DiagnosticPage() {
  const [message, setMessage] = useState("");
  const [lastDiagnostic, setLastDiagnostic] = useState<any>(null);
  const [ticketMsg, setTicketMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const type = (form.problemType as HTMLSelectElement).value;
    const description = (form.description as HTMLTextAreaElement).value;
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id) {
      setMessage("Erreur d'authentification. Veuillez vous connecter.");
      return;
    }
    const userId = data.user.id;
    const date = new Date().toISOString().slice(0, 10);
    const diagnostic = { type, description, userId, date, status: "En attente" };
    setMessage("Enregistrement du diagnostic...");
    const result = await saveDiagnostic(diagnostic);
    if (result?.success) {
      setMessage("Diagnostic enregistré avec succès !");
      setLastDiagnostic(diagnostic);
      form.reset();
    } else {
      setMessage("Erreur lors de l’enregistrement du diagnostic.");
      setLastDiagnostic(null);
    }
    setTimeout(() => { setMessage(""); }, 3000);
  }

  async function handleCreateTicketFromResult() {
    if (!lastDiagnostic) return;
    setTicketMsg("Création du ticket en cours...");
    const result = await createTicketFromDiagnostic(null, lastDiagnostic);
    if (result?.success) {
      setTicketMsg("Ticket de maintenance créé avec succès !");
    } else {
      setTicketMsg("Erreur lors de la création du ticket.");
    }
    setTimeout(() => { setTicketMsg(""); }, 3000);
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Diagnostic Informatique</h1>
      <p className="mb-6">Cette page vous permet de lancer un diagnostic automatique ou guidé pour identifier les problèmes sur votre poste ou réseau. Vous pouvez ensuite créer un ticket de maintenance avec le rapport généré.</p>
      <a href="/diagnostic/history" className="inline-block mb-6 text-blue-700 underline">Voir l’historique des diagnostics</a>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Assistant IA de diagnostic</h2>
        <AiAssistant context="diagnostic" />
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Formulaire de diagnostic</h2>
        <form aria-label="Formulaire de diagnostic" onSubmit={handleSubmit}>
          <label htmlFor="problemType" className="block mb-2">Type de problème&nbsp;:</label>
          <select id="problemType" name="problemType" className="mb-4 w-full p-2 border rounded">
            <option value="hardware">Matériel</option>
            <option value="software">Logiciel</option>
            <option value="network">Réseau</option>
            <option value="other">Autre</option>
          </select>
          <label htmlFor="description" className="block mb-2">Décrivez le problème&nbsp;:</label>
          <textarea id="description" name="description" rows={4} className="mb-4 w-full p-2 border rounded" aria-required="true" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Lancer le diagnostic</button>
        </form>
        {message && <div className="mt-2 text-green-700" aria-live="polite">{message}</div>}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Résultats et suggestions</h2>
        {lastDiagnostic ? (
          <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded">
            <div className="mb-2 font-semibold">Diagnostic du {lastDiagnostic.date}</div>
            <div className="text-sm">Type : {lastDiagnostic.type}</div>
            <div className="text-sm">Description : {lastDiagnostic.description}</div>
            <div className="text-sm">Statut : {lastDiagnostic.status}</div>
            <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCreateTicketFromResult} aria-label="Créer un ticket de maintenance">Créer un ticket de maintenance</button>
            {ticketMsg && <div className="mt-2 text-green-700" aria-live="polite">{ticketMsg}</div>}
          </div>
        ) : (
          <div aria-live="polite" className="bg-gray-100 dark:bg-zinc-800 p-4 rounded">Les résultats du diagnostic s’afficheront ici, avec des suggestions d’actions ou la possibilité de créer un ticket de maintenance.</div>
        )}
      </section>
    </main>
  );
}
