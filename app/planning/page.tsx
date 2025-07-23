"use client"
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
  assigned_to?: string | null;
}

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
}

function getMonthDays(year: number, month: number) {
  // month: 0-based
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function PlanningPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { toast } = useToast();
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<Partial<Event>>({});
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Charger les utilisateurs/techniciens pour l'affectation
  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase.from("profiles").select("id, full_name, username");
      if (!error) setProfiles(data || []);
    }
    fetchProfiles();
  }, [supabase]);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const { data, error } = await supabase.from("planning_events").select("*").order("date", { ascending: true });
      if (!error) setEvents(data || []);
      setLoading(false);
    }
    fetchEvents();
  }, [supabase]);

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !(newDate || selectedDate) || !newType) return;
    const dateToUse = newDate || selectedDate;
    const { error } = await supabase.from("planning_events").insert({
      title: newTitle,
      date: dateToUse,
      type: newType,
      assigned_to: newAssignedTo || null,
    });
    if (!error) {
      setNewTitle("");
      setNewDate("");
      setNewType("");
      setNewAssignedTo("");
      setSelectedDate(null);
      const { data } = await supabase.from("planning_events").select("*").order("date", { ascending: true });
      setEvents(data || []);
    }
  }

  async function handleEditEvent(ev: Event) {
    setEditEventId(ev.id);
    setEditEvent({ ...ev });
  }
  async function handleSaveEditEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!editEventId || !editEvent.title || !editEvent.date || !editEvent.type) return;
    const { error } = await supabase.from("planning_events").update({
      title: editEvent.title,
      date: editEvent.date,
      type: editEvent.type,
      assigned_to: editEvent.assigned_to || null,
    }).eq("id", editEventId);
    if (!error) {
      setEditEventId(null);
      setEditEvent({});
      const { data } = await supabase.from("planning_events").select("*").order("date", { ascending: true });
      setEvents(data || []);
    }
  }
  async function handleDeleteEvent(id: string) {
    const { error } = await supabase.from("planning_events").delete().eq("id", id);
    if (!error) {
      setEvents(events.filter(ev => ev.id !== id));
    }
  }

  function getAssignedName(id: string | null | undefined) {
    if (!id) return "-";
    const p = profiles.find(p => p.id === id);
    return p ? (p.full_name || p.username || p.id) : id;
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Planning des interventions</h1>
      <div className="mb-4 flex gap-2">
        <Button variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>Liste</Button>
        <Button variant={view === 'calendar' ? 'default' : 'outline'} onClick={() => setView('calendar')}>Calendrier</Button>
      </div>
      {view === 'calendar' ? (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Button size="sm" variant="outline" onClick={() => setCalendarMonth(m => ({ year: m.month === 0 ? m.year - 1 : m.year, month: m.month === 0 ? 11 : m.month - 1 }))}>&lt;</Button>
            <span className="font-semibold text-lg">{new Date(calendarMonth.year, calendarMonth.month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            <Button size="sm" variant="outline" onClick={() => setCalendarMonth(m => ({ year: m.month === 11 ? m.year + 1 : m.year, month: m.month === 11 ? 0 : m.month + 1 }))}>&gt;</Button>
          </div>
          <div className="grid grid-cols-7 gap-1 border rounded overflow-hidden bg-white">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => (
              <div key={d} className="bg-gray-100 text-center py-1 text-xs font-semibold">{d}</div>
            ))}
            {/* Empty cells for first day */}
            {(() => {
              const first = new Date(calendarMonth.year, calendarMonth.month, 1);
              let empty = (first.getDay() + 6) % 7; // Monday=0
              return Array.from({ length: empty }).map((_, i) => <div key={"empty-"+i}></div>);
            })()}
            {getMonthDays(calendarMonth.year, calendarMonth.month).map(day => {
              const dayEvents = events.filter(ev => {
                if (!ev.date) return false;
                const evDate = new Date(ev.date);
                return sameDay(evDate, day);
              });
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[60px] border p-1 align-top cursor-pointer ${selectedDate === day.toISOString().slice(0, 10) ? 'bg-blue-50' : ''}`}
                  onClick={e => {
                    // Si clic sur le fond du jour, sélectionne la date pour ajout
                    if ((e.target as HTMLElement).dataset.eventid) {
                      const ev = events.find(ev => ev.id === (e.target as HTMLElement).dataset.eventid);
                      if (ev) setSelectedEvent(ev);
                    } else {
                      setSelectedDate(day.toISOString().slice(0, 10));
                    }
                  }}
                  title="Ajouter un événement à cette date ou voir les détails"
                >
                  <div className="text-xs font-bold mb-1">{day.getDate()}</div>
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="bg-blue-100 text-blue-800 rounded px-1 mb-1 text-xs truncate hover:bg-blue-200"
                      title={ev.title + ' (' + ev.type + ')'}
                      data-eventid={ev.id}
                      style={{ cursor: 'pointer' }}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {selectedDate && (
            <div className="mt-2 text-sm text-blue-700">Date sélectionnée pour l’ajout : {selectedDate} <Button size="sm" variant="ghost" onClick={() => setSelectedDate(null)}>Annuler</Button></div>
          )}
        </section>
      ) : null}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Ajouter un événement</h2>
        <form className="flex gap-2 mb-4 flex-wrap" onSubmit={handleAddEvent}>
          <input
            type="text"
            placeholder="Titre"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="border p-2 rounded"
            aria-label="Titre de l'événement"
            required
          />
          <input
            type="date"
            value={newDate || selectedDate || ''}
            onChange={e => setNewDate(e.target.value)}
            className="border p-2 rounded"
            aria-label="Date de l'événement"
            required
          />
          <input
            type="text"
            placeholder="Type"
            value={newType}
            onChange={e => setNewType(e.target.value)}
            className="border p-2 rounded"
            aria-label="Type d'événement"
            required
          />
          <select className="border p-2 rounded" value={newAssignedTo} onChange={e => setNewAssignedTo(e.target.value)}>
            <option value="">Affecter à...</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.full_name || p.username || p.id}</option>
            ))}
          </select>
          <Button type="submit" className="bg-blue-600 text-white">Ajouter</Button>
        </form>
      </section>
      {view === 'list' && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Événements à venir</h2>
          {loading ? (
            <div className="text-muted-foreground">Chargement...</div>
          ) : (
            <ul className="space-y-2">
              {events.map(ev => (
                <li key={ev.id} className="border p-3 rounded flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  {editEventId === ev.id ? (
                    <form className="flex flex-col md:flex-row gap-2 w-full" onSubmit={handleSaveEditEvent}>
                      <input
                        type="text"
                        value={editEvent.title || ''}
                        onChange={e => setEditEvent(ev => ({ ...ev, title: e.target.value }))}
                        className="border p-2 rounded w-full md:w-40"
                        required
                      />
                      <input
                        type="date"
                        value={editEvent.date || ''}
                        onChange={e => setEditEvent(ev => ({ ...ev, date: e.target.value }))}
                        className="border p-2 rounded w-full md:w-32"
                        required
                      />
                      <input
                        type="text"
                        value={editEvent.type || ''}
                        onChange={e => setEditEvent(ev => ({ ...ev, type: e.target.value }))}
                        className="border p-2 rounded w-full md:w-32"
                        required
                      />
                      <select className="border p-2 rounded w-full md:w-40" value={editEvent.assigned_to || ''} onChange={e => setEditEvent(ev => ({ ...ev, assigned_to: e.target.value }))}>
                        <option value="">Affecter à...</option>
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>{p.full_name || p.username || p.id}</option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" className="bg-blue-600 text-white">Enregistrer</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditEventId(null)}>Annuler</Button>
                    </form>
                  ) : (
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-4">
                      <div className="flex-1">
                        <span className="font-bold">{ev.title}</span> <span className="text-gray-500">({ev.type})</span><br />
                        <span className="text-sm">{ev.date}</span>
                        <span className="ml-2 text-xs text-blue-700">{getAssignedName(ev.assigned_to)}</span>
                      </div>
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <Button size="sm" variant="outline" onClick={() => handleEditEvent(ev)}>Modifier</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(ev.id)}>Supprimer</Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {/* Détail événement (modal) */}
      <Dialog open={!!selectedEvent} onOpenChange={open => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail de l’événement</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2">
              <div><span className="font-semibold">Titre :</span> {selectedEvent.title}</div>
              <div><span className="font-semibold">Type :</span> {selectedEvent.type}</div>
              <div><span className="font-semibold">Date :</span> {selectedEvent.date}</div>
              <div><span className="font-semibold">Affecté à :</span> {getAssignedName(selectedEvent.assigned_to)}</div>
            </div>
          )}
          <DialogFooter>
            {/* Si admin, afficher Modifier/Supprimer */}
            {selectedEvent && (
              <>
                <Button variant="outline" onClick={() => { setEditEventId(selectedEvent.id); setEditEvent(selectedEvent); setSelectedEvent(null); }}>Modifier</Button>
                <Button variant="destructive" onClick={() => { handleDeleteEvent(selectedEvent.id); setSelectedEvent(null); }}>Supprimer</Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setSelectedEvent(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
