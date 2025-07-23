"use client"
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import React from "react"; // Added for React.Fragment

interface Material {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
}

interface MaterialHistory {
  id: string;
  material_id: string;
  ticket_id?: string | null;
  action: string;
  performed_by?: string | null;
  performed_at: string;
  details?: string | null;
}

export default function AdminMaterialPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { toast } = useToast();
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [materialHistory, setMaterialHistory] = useState<Record<string, MaterialHistory[]>>({});

  // Charger les utilisateurs/techniciens pour l'affectation
  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase.from("profiles").select("id, full_name, username");
      if (!error) setProfiles(data || []);
    }
    fetchProfiles();
  }, [supabase]);

  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true);
      const { data, error } = await supabase.from("materials").select("*");
      if (!error) setMaterials(data || []);
      setLoading(false);
    }
    fetchMaterials();
  }, [supabase]);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);

  function handleEdit(mat: Material) {
    setEditMaterial(mat);
  }
  // Ajout d'un matériel
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({ name: '', type: '', location: '', status: 'Fonctionnel' });
  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!newMaterial.name || !newMaterial.type || !newMaterial.location) return;
    const { error } = await supabase.from('materials').insert({
      name: newMaterial.name,
      type: newMaterial.type,
      location: newMaterial.location,
      status: newMaterial.status || 'Fonctionnel',
    });
    if (!error) {
      setNewMaterial({ name: '', type: '', location: '', status: 'Fonctionnel' });
      const { data } = await supabase.from('materials').select('*');
      setMaterials(data || []);
    }
  }

  // Modification d'un matériel
  async function handleSave(mat: Material) {
    const { error } = await supabase.from('materials').update({
      name: mat.name,
      type: mat.type,
      location: mat.location,
      status: mat.status,
    }).eq('id', mat.id);
    if (!error) {
      setEditMaterial(null);
      const { data } = await supabase.from('materials').select('*');
      setMaterials(data || []);
    }
  }

  // Suppression d'un matériel
  async function handleDelete(id: string) {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (!error) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  }

  // Affichage du nom de l'affecté
  function getAssignedName(id: string | null | undefined) {
    if (!id) return "-";
    const p = profiles.find(p => p.id === id);
    return p ? (p.full_name || p.username || p.id) : id;
  }

  // Charger l'historique d'un matériel à la demande
  async function fetchMaterialHistory(materialId: string) {
    if (materialHistory[materialId]) return; // déjà chargé
    const { data, error } = await supabase
      .from('material_history')
      .select('*')
      .eq('material_id', materialId)
      .order('performed_at', { ascending: false });
    if (!error) setMaterialHistory(h => ({ ...h, [materialId]: data || [] }));
  }

  // Ajout d'une action d'historique
  const [historyAction, setHistoryAction] = useState<{ [materialId: string]: { action: string; details: string } }>({});
  async function handleAddHistory(materialId: string) {
    const entry = historyAction[materialId];
    if (!entry || !entry.action) return;
    const { error } = await supabase.from('material_history').insert({
      material_id: materialId,
      action: entry.action,
      details: entry.details,
      performed_at: new Date().toISOString(),
    });
    if (!error) {
      setHistoryAction(h => ({ ...h, [materialId]: { action: '', details: '' } }));
      await fetchMaterialHistory(materialId);
    } else {
      toast({ title: "Erreur", description: "Impossible d'enregistrer l'action.", variant: "destructive" });
    }
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion du parc matériel</h1>
      <table className="w-full border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Nom</th>
            <th className="p-2">Type</th>
            <th className="p-2">Localisation</th>
            <th className="p-2">État</th>
            <th className="p-2">Affecté à</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map(mat => (
            <React.Fragment key={mat.id}>
              <tr className="border-b">
                <td className="p-2">{mat.name}</td>
                <td className="p-2">{mat.type}</td>
                <td className="p-2">{mat.location}</td>
                <td className="p-2">{mat.status}</td>
                <td className="p-2">{getAssignedName(mat.assigned_to)}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(mat)}>Modifier</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(mat.id)}>Supprimer</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { setHistoryOpen(historyOpen === mat.id ? null : mat.id); if (historyOpen !== mat.id) await fetchMaterialHistory(mat.id); }}>
                    {historyOpen === mat.id ? "Masquer l'historique" : "Voir l'historique"}
                  </Button>
                </td>
              </tr>
              {historyOpen === mat.id && (
                <tr>
                  <td colSpan={6} className="bg-gray-50 p-4">
                    <h3 className="font-semibold mb-2">Historique des interventions</h3>
                    <form className="flex flex-col md:flex-row gap-2 mb-4" onSubmit={e => { e.preventDefault(); handleAddHistory(mat.id); }}>
                      <select className="border p-2 w-full md:w-40" value={historyAction[mat.id]?.action || ''} onChange={e => setHistoryAction(h => ({ ...h, [mat.id]: { ...(h[mat.id] || { details: '' }), action: e.target.value } }))} required>
                        <option value="">Type d'action...</option>
                        <option value="Affecté">Affecté</option>
                        <option value="Réparé">Réparé</option>
                        <option value="Mis en maintenance">Mis en maintenance</option>
                        <option value="Autre">Autre</option>
                      </select>
                      <input className="border p-2 w-full md:w-64" placeholder="Détails (optionnel)" value={historyAction[mat.id]?.details || ''} onChange={e => setHistoryAction(h => ({ ...h, [mat.id]: { ...(h[mat.id] || { action: '' }), details: e.target.value } }))} />
                      <Button type="submit" size="sm">Ajouter</Button>
                    </form>
                    {materialHistory[mat.id]?.length ? (
                      <ul className="space-y-2">
                        {materialHistory[mat.id].map(h => (
                          <li key={h.id} className="border-b pb-2">
                            <span className="font-medium">{h.action}</span>
                            <span className="ml-2 text-xs text-gray-500">{new Date(h.performed_at).toLocaleString()}</span>
                            {h.details && <div className="text-sm text-gray-700 mt-1">{h.details}</div>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-muted-foreground">Aucune intervention enregistrée.</div>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {editMaterial && (
        <div className="bg-gray-50 p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Modifier le matériel</h2>
          <form onSubmit={async e => {
            e.preventDefault();
            // Update affectation
            const { error } = await supabase.from('materials').update({
              name: editMaterial.name,
              type: editMaterial.type,
              location: editMaterial.location,
              status: editMaterial.status,
              assigned_to: editMaterial.assigned_to || null,
            }).eq('id', editMaterial.id);
            if (!error) {
              setEditMaterial(null);
              const { data } = await supabase.from('materials').select('*');
              setMaterials(data || []);
            } else {
              toast({ title: "Erreur", description: "Impossible de modifier le matériel.", variant: "destructive" });
            }
          }}>
            <label className="block mb-2">Nom&nbsp;:
              <input className="border p-2 w-full" value={editMaterial.name} onChange={e => setEditMaterial({ ...editMaterial!, name: e.target.value })} />
            </label>
            <label className="block mb-2">Type&nbsp;:
              <input className="border p-2 w-full" value={editMaterial.type} onChange={e => setEditMaterial({ ...editMaterial!, type: e.target.value })} />
            </label>
            <label className="block mb-2">Localisation&nbsp;:
              <input className="border p-2 w-full" value={editMaterial.location} onChange={e => setEditMaterial({ ...editMaterial!, location: e.target.value })} />
            </label>
            <label className="block mb-2">État&nbsp;:
              <select className="border p-2 w-full" value={editMaterial.status} onChange={e => setEditMaterial({ ...editMaterial!, status: e.target.value })}>
                <option value="Fonctionnel">Fonctionnel</option>
                <option value="En panne">En panne</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </label>
            <label className="block mb-2">Affecté à&nbsp;:
              <select className="border p-2 w-full" value={editMaterial.assigned_to || ''} onChange={e => setEditMaterial({ ...editMaterial!, assigned_to: e.target.value })}>
                <option value="">Aucun</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.username || p.id}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enregistrer</button>
            <button type="button" className="ml-2 text-gray-600" onClick={() => setEditMaterial(null)}>Annuler</button>
          </form>
        </div>
      )}
      {/* Formulaire d'ajout */}
      <div className="bg-gray-50 p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Ajouter un matériel</h2>
        <form onSubmit={handleAddMaterial} className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
          <input className="border p-2 w-full md:w-40" placeholder="Nom" value={newMaterial.name || ''} onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })} required />
          <input className="border p-2 w-full md:w-32" placeholder="Type" value={newMaterial.type || ''} onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value })} required />
          <input className="border p-2 w-full md:w-32" placeholder="Localisation" value={newMaterial.location || ''} onChange={e => setNewMaterial({ ...newMaterial, location: e.target.value })} required />
          <select className="border p-2 w-full md:w-32" value={newMaterial.status || 'Fonctionnel'} onChange={e => setNewMaterial({ ...newMaterial, status: e.target.value })}>
            <option value="Fonctionnel">Fonctionnel</option>
            <option value="En panne">En panne</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <select className="border p-2 w-full md:w-40" value={newMaterial.assigned_to || ''} onChange={e => setNewMaterial({ ...newMaterial, assigned_to: e.target.value })}>
            <option value="">Affecter à...</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.full_name || p.username || p.id}</option>
            ))}
          </select>
          <Button type="submit" className="bg-blue-600 text-white">Ajouter</Button>
        </form>
      </div>
    </main>
  );
}
