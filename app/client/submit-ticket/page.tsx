"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createTicket } from "@/lib/tickets"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useToast } from "@/components/ui/use-toast"
import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

function SubmitTicketButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Soumission en cours..." : "Soumettre le ticket"}
    </Button>
  )
}

export default function SubmitTicketPage() {
  const [state, formAction] = useActionState(createTicket, undefined)
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedPriority, setSelectedPriority] = useState<string>("Normal")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.error) {
      toast({
        title: "Soumission de ticket échouée",
        description: state.error,
        variant: "destructive",
      })
    } else if (state?.success) {
      toast({
        title: "Ticket soumis",
        description: "Votre ticket a été soumis avec succès !",
        variant: "default",
      })
      formRef.current?.reset()
      setSelectedCategory(undefined)
      setSelectedPriority("Normal")
    }
  }, [state, toast])

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden px-4" role="main" aria-label="Soumettre un ticket IT">
     
      {/* Dégradé animé en fond */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
        {/* Bloc formulaire */}
        <div className="flex-1 flex flex-col items-center md:items-start">
          <Card className="w-full max-w-2xl backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 rounded-3xl shadow-2xl border border-white/30 dark:border-zinc-800/40" tabIndex={0} aria-label="Formulaire de soumission de ticket">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent" tabIndex={0}>Soumettre un ticket IT</CardTitle>
              <CardDescription tabIndex={0} className="text-slate-700 dark:text-slate-200">Merci de remplir le formulaire ci-dessous pour signaler votre problème informatique.</CardDescription>
            </CardHeader>
            <form ref={formRef} action={formAction} aria-label="Champs de soumission de ticket">
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titre du ticket</Label>
                  <Input id="title" name="title" type="text" placeholder="Ex : Wi-Fi ne se connecte pas" required autoFocus aria-required="true" aria-label="Titre du ticket" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description détaillée</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Décrivez le problème, les étapes pour le reproduire, etc."
                    rows={5}
                    required
                    aria-required="true"
                    aria-label="Description détaillée"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select name="category" value={selectedCategory} onValueChange={setSelectedCategory} required>
                    <SelectTrigger id="category" aria-label="Sélectionner une catégorie">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware">Matériel</SelectItem>
                      <SelectItem value="Software">Logiciel</SelectItem>
                      <SelectItem value="Network">Réseau</SelectItem>
                      <SelectItem value="Account">Compte/Connexion</SelectItem>
                      <SelectItem value="Other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    (La catégorie sera suggérée automatiquement par l'IA à la soumission, mais vous pouvez la modifier.)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select name="priority" value={selectedPriority} onValueChange={setSelectedPriority} required>
                    <SelectTrigger id="priority" aria-label="Sélectionner la priorité">
                      <SelectValue placeholder="Sélectionner la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Basse</SelectItem>
                      <SelectItem value="Normal">Normale</SelectItem>
                      <SelectItem value="High">Haute</SelectItem>
                      <SelectItem value="Critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">(Indiquez l'urgence de votre demande.)</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="attachment">Pièce jointe (optionnel)</Label>
                  <Input id="attachment" name="attachment" type="file" aria-label="Pièce jointe" />
                  <p className="text-sm text-muted-foreground mt-1">(Ex : capture d'écran de l'erreur, document pertinent)</p>
                </div>
              </CardContent>
              <CardFooter>
                <SubmitTicketButton />
              </CardFooter>
            </form>
            {state?.success && (
              <div className="flex flex-col items-center justify-center py-6" role="status" aria-live="polite">
                <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-2"><circle cx="12" cy="12" r="10" fill="#d1fae5"/><path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-green-700 font-semibold">Ticket soumis avec succès !</span>
              </div>
            )}
            {state?.error && (
              <div className="flex flex-col items-center justify-center py-6" role="alert" aria-live="assertive">
                <svg width="64" height="64" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="mb-2"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-red-700 font-semibold">{state.error}</span>
              </div>
            )}
          </Card>
        </div>
        
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
