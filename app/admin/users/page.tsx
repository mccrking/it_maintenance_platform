"use client"
import React, { useState, useMemo, useEffect, useTransition } from "react"
import { Download, List } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useActionState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserRole } from "@/lib/actions/admin-users"
import { updateUserProfile, deleteUser } from "@/lib/actions/admin-users"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"


export default function AdminUsersPage() {
  // Gestion avancée des utilisateurs
  type User = {
    id: string;
    full_name?: string;
    username?: string;
    email?: string;
    role: string;
  };
  const [editUser, setEditUser] = useState<User | null>(null);

  function handleEdit(user: User) {
    setEditUser({ ...user });
  }

  async function handleDelete(id: string) {
    const formData = new FormData();
    formData.append("userId", id);
    const result = await deleteUser({}, formData);
    if (result?.error) {
      toast({ title: "Erreur suppression", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Utilisateur supprimé", description: `L'utilisateur a été supprimé avec succès.`, variant: "default" });
      setRefresh(r => r + 1);
    }
  }

  async function handleSave(user: User) {
    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("full_name", user.full_name || "");
    formData.append("username", user.username || "");
    formData.append("role", user.role);
    const result = await updateUserProfile({}, formData);
    if (result?.error) {
      toast({ title: "Erreur modification", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Utilisateur modifié", description: `L'utilisateur a été modifié avec succès.`, variant: "default" });
      setEditUser(null);
      setRefresh(r => r + 1);
    }
  }
  const [refresh, setRefresh] = useState(0)
  type State = { error?: string; success?: string }
  const initialState: State = {}
  const [state, formAction] = useActionState(
    async (prevState: State, formData: FormData): Promise<State> => {
      const result = await updateUserRole(prevState, formData)
      if (result && result.success) setRefresh((r) => r + 1)
      // Ensure result.success is a string if successful
      if (result && typeof result.success === "boolean" && result.success) {
        return { success: "true" }
      }
      if (result && result.error) {
        return { error: result.error }
      }
      // If result.success is already a string, just return as is
      if (result && typeof result.success === "boolean") {
        return { ...result, success: result.success ? "true" : undefined }
      }
      return result
    },
    initialState
  )
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [confirmUser, setConfirmUser] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<string | null>(null)
  const [showAudit, setShowAudit] = useState(false)
  const [showProfile, setShowProfile] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const pageSize = 10

  useEffect(() => {
    if (state?.error) {
      toast({
        title: "Role Update Failed",
        description: state.error,
        variant: "destructive",
      })
    } else if (state?.success) {
      toast({
        title: "Role Updated",
        description: "User role updated successfully.",
        variant: "default",
      })
    }
  }, [state, toast])
  // Fetch all profiles for admin table
  const { profiles, loading, error } = require("@/hooks/use-admin-profiles").useAdminProfiles(refresh)
  const roles = ["admin", "technician", "client"]

  // Statistics
  const stats = useMemo(() => {
    const total = profiles.length
    const byRole = roles.reduce((acc, role) => {
      acc[role] = profiles.filter((p: typeof profiles[number]) => p.role === role).length
      return acc
    }, {} as Record<string, number>)
    return { total, byRole }
  }, [profiles])

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    if (!search) return profiles
    const s = search.toLowerCase()
    return profiles.filter(
      (p: typeof profiles[number]) =>
        (p.full_name && p.full_name.toLowerCase().includes(s)) ||
        (p.username && p.username.toLowerCase().includes(s)) ||
        (p.role && p.role.toLowerCase().includes(s))
    )
  }, [profiles, search])

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / pageSize)
  const paginatedProfiles = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProfiles.slice(start, start + pageSize)
  }, [filteredProfiles, page])

  // Audit log (demo, static)
  const auditLog = [
    { id: 1, action: "Role changed", user: "admin", target: "jdoe", detail: "client → technician", date: "2025-07-15 14:22" },
    { id: 2, action: "Role changed", user: "admin", target: "asmith", detail: "technician → admin", date: "2025-07-14 09:10" },
  ]

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto animate-fade-in-up">
        <main className="flex-1 w-full py-8">
          <Card className="max-w-5xl mx-auto mt-8 shadow-lg border-2 border-blue-200 dark:border-fuchsia-800 bg-white/90 dark:bg-zinc-900/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent">Gestion des utilisateurs</CardTitle>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" aria-label="Exporter CSV" onClick={() => {
                        const csv = [
                          ["Nom", "Username", "Rôle"],
                          ...filteredProfiles.map((p: typeof filteredProfiles[number]) => [p.full_name, p.username, p.role])
                        ].map((row: (string | null)[]) => row.map((x: string | null) => `"${x ?? ''}"`).join(",")).join("\n")
                        const blob = new Blob([csv], { type: "text/csv" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `utilisateurs_${new Date().toISOString().slice(0,10)}.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}>
                        <Download className="mr-1 w-4 h-4" /> Exporter
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exporter la liste des utilisateurs en CSV</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" aria-label="Voir l'audit log" onClick={() => setShowAudit(true)}>
                        <List className="mr-1 w-4 h-4" /> Audit log
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voir l'audit log</TooltipContent>
                  </Tooltip>
                  <span className="text-2xl font-bold">{stats.total}</span>
                  <span className="text-xs text-muted-foreground">Utilisateurs</span>
                </div>
                {roles.map((role) => (
                  <div key={role} className="flex flex-col items-center">
                    <span className="text-lg font-semibold">{stats.byRole[role]}</span>
                    <span className="text-xs text-muted-foreground">{role.charAt(0).toUpperCase() + role.slice(1)}s</span>
                  </div>
                ))}
                <input
                  type="text"
                  className="ml-auto border rounded px-2 py-1 text-sm min-w-[200px]"
                  placeholder="Rechercher par nom, username, rôle..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-red-500 mb-4">Erreur: {error}</div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Avatar</th>
                      <th className="p-2 text-left">Nom</th>
                      <th className="p-2 text-left">Nom d'utilisateur</th>
                      <th className="p-2 text-left">Rôle</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="p-4 text-center">Chargement...</td></tr>
                    ) : paginatedProfiles.length === 0 ? (
                      <tr><td colSpan={5} className="p-4 text-center">Aucun utilisateur trouvé.</td></tr>
                    ) : (
                      paginatedProfiles.map((profile: typeof paginatedProfiles[number]) => (
                        <tr key={profile.id} className="border-b">
                          <td className="p-2">
                            <img
                              src={profile.avatar_url || "/placeholder-user.jpg"}
                              alt={profile.full_name || profile.username || "Avatar"}
                              className="w-10 h-10 rounded-full object-cover border cursor-pointer"
                              onClick={() => setShowProfile(profile)}
                              onError={e => { e.currentTarget.src = "/placeholder-user.jpg" }}
                            />
                          </td>
                          <td className="p-2 font-medium">{profile.full_name || <span className="text-muted-foreground">(non renseigné)</span>}</td>
                          <td className="p-2">{profile.username || <span className="text-muted-foreground">(non renseigné)</span>}</td>
                          <td className="p-2">
                            <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-semibold">
                              {profile.role}
                            </span>
                          </td>
                          <td className="p-2">
                            <form
                              action={formAction}
                              className="flex gap-2 items-center"
                              onSubmit={e => {
                                if (pendingRole && confirmUser === profile.id) return
                                e.preventDefault()
                                const form = e.currentTarget
                                const newRole = form.newRole.value
                                if (newRole !== profile.role) {
                                  setConfirmUser(profile.id)
                                  setPendingRole(newRole)
                                } else {
                                  formAction(new FormData(form))
                                }
                              }}
                            >
                              <input type="hidden" name="userId" value={profile.id} />
                              <Select name="newRole" defaultValue={profile.role}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button type="submit" size="sm" variant="secondary" disabled={isPending} aria-busy={isPending} aria-label="Mettre à jour le rôle">
                                    {isPending ? "Mise à jour..." : "Mettre à jour"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Changer le rôle de l'utilisateur</TooltipContent>
                              </Tooltip>
                            </form>
                            {/* Confirmation Dialog */}
                            {confirmUser === profile.id && pendingRole && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                <div className="bg-white dark:bg-zinc-900 rounded shadow-lg p-6 max-w-xs w-full">
                                  <div className="mb-4 text-center">
                                    <div className="font-bold mb-2">Confirmer le changement de rôle</div>
                                    <div className="text-sm">Voulez-vous vraiment changer le rôle de <span className="font-semibold">{profile.full_name || profile.username}</span> en <span className="font-semibold">{pendingRole}</span> ?</div>
                                  </div>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={isPending}
                                      aria-busy={isPending}
                                      onClick={() => {
                                        // Submit the form with new role
                                        const form = document.createElement("form")
                                        form.action = ""
                                        form.method = "POST"
                                        form.style.display = "none"
                                        const userIdInput = document.createElement("input")
                                        userIdInput.name = "userId"
                                        userIdInput.value = profile.id
                                        form.appendChild(userIdInput)
                                        const newRoleInput = document.createElement("input")
                                        newRoleInput.name = "newRole"
                                        newRoleInput.value = pendingRole
                                        form.appendChild(newRoleInput)
                                        document.body.appendChild(form)
                                        startTransition(() => {
                                          formAction(new FormData(form))
                                        })
                                        document.body.removeChild(form)
                                        setConfirmUser(null)
                                        setPendingRole(null)
                                      }}
                                    >{isPending ? "Mise à jour..." : "Confirmer"}</Button>
                                    <Button size="sm" variant="secondary" onClick={() => { setConfirmUser(null); setPendingRole(null) }}>Annuler</Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Profile Details Modal */}
                            {showProfile && showProfile.id === profile.id && (
                              // Accessibility: focus trap and ESC close
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" tabIndex={-1} aria-modal="true" role="dialog" onKeyDown={e => { if (e.key === 'Escape') setShowProfile(null) }}>
                                <div className="bg-white dark:bg-zinc-900 rounded shadow-lg p-6 max-w-sm w-full">
                                  <div className="flex items-center gap-4 mb-4">
                                    <img src={showProfile.avatar_url || "/placeholder-user.jpg"} alt="Avatar" className="w-16 h-16 rounded-full border" />
                                    <div>
                                      <div className="font-bold text-lg">{showProfile.full_name || <span className="text-muted-foreground">(non renseigné)</span>}</div>
                                      <div className="text-sm text-muted-foreground">@{showProfile.username || "(non renseigné)"}</div>
                                      <div className="text-xs mt-1">Rôle: <span className="font-semibold">{showProfile.role}</span></div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-4">ID: {showProfile.id}</div>
                                  <Button size="sm" variant="secondary" autoFocus onClick={() => setShowProfile(null)}>Fermer</Button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="flex justify-center gap-2 mt-4" aria-label="Pagination">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Page précédente">Précédent</Button>
                  <span className="px-2 py-1 text-xs">Page {page} / {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Page suivante">Suivant</Button>
                </nav>
              )}
              {/* Audit Log Modal */}
              {showAudit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" tabIndex={-1} aria-modal="true" role="dialog" onKeyDown={e => { if (e.key === 'Escape') setShowAudit(false) }}>
                  <div className="bg-white dark:bg-zinc-900 rounded shadow-lg p-6 max-w-lg w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-bold text-lg">Audit log</div>
                      <Button size="sm" variant="secondary" autoFocus onClick={() => setShowAudit(false)}>Fermer</Button>
                    </div>
                    <table className="min-w-full border text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Action</th>
                          <th className="p-2 text-left">Admin</th>
                          <th className="p-2 text-left">Cible</th>
                          <th className="p-2 text-left">Détail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLog.map((log) => (
                          <tr key={log.id} className="border-b">
                            <td className="p-2">{log.date}</td>
                            <td className="p-2">{log.action}</td>
                            <td className="p-2">{log.user}</td>
                            <td className="p-2">{log.target}</td>
                            <td className="p-2">{log.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Advanced User Management Section */}
          <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent">Gestion avancée des utilisateurs</h1>
            <table className="w-full border mb-6">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="p-2">Nom</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Rôle</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((user: User) => (
                  <tr key={user.id} className="border-b bg-white dark:bg-zinc-900">
                    <td className="p-2">{user.full_name || <span className="text-muted-foreground">(non renseigné)</span>}</td>
                    <td className="p-2">{user.email || <span className="text-muted-foreground">(non renseigné)</span>}</td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>Modifier</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>Supprimer</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editUser && (
              <div className="bg-gray-50 p-4 rounded shadow mb-6">
                <h2 className="text-xl font-semibold mb-2">Modifier l'utilisateur</h2>
                <form onSubmit={e => { e.preventDefault(); handleSave(editUser); }}>
                  <label className="block mb-2">Nom&nbsp;:
                    <input className="border p-2 w-full" value={editUser.full_name ?? ""} onChange={e => setEditUser({ ...editUser, full_name: e.target.value })} />
                  </label>
                  <label className="block mb-2">Email&nbsp;:
                    <input className="border p-2 w-full" value={editUser.username ?? ""} onChange={e => setEditUser({ ...editUser, username: e.target.value })} />
                  </label>
                  <label className="block mb-2">Rôle&nbsp;:
                    <select className="border p-2 w-full" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="technician">Technicien</option>
                      <option value="client">Client</option>
                      <option value="invite">Invité</option>
                    </select>
                  </label>
                  <Button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enregistrer</Button>
                  <Button type="button" className="ml-2 text-gray-600" onClick={() => setEditUser(null)}>Annuler</Button>
                </form>
              </div>
            )}
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
  )
}
