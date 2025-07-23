"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getUserSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import Image from "next/image"
import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { CheckCircle, Zap, Users, BarChart2, MessageCircle, HelpCircle } from "lucide-react";

export default function HomePage() {
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getUserSession()
      if (session) {
        redirect("/client/dashboard")
      }
    }
    checkAuth()
  }, [])

  return (
    <main className="w-full min-h-screen bg-background flex flex-col items-center">
      {/* En-tête */}
      <section className="w-full max-w-6xl px-4 md:px-8 pt-16 pb-10 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent">Smart IT Maintenance Platform</h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 mb-6">Plateforme intelligente et centralisée pour la gestion des incidents informatiques. Optimisez le suivi, l’intervention, l’analyse et la satisfaction utilisateur grâce à une interface moderne, des exports professionnels et une IA intégrée.</p>
          <div className="flex gap-4 mb-4">
            <a href="/login" className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 text-white font-semibold shadow-lg hover:scale-105 transition">Connexion</a>
            <a href="/signup" className="px-6 py-2 rounded-full border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 transition">Créer un compte</a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <img src="/logo-it-maintenance.png" alt="IT Illustration" className="w-64 h-64 object-contain drop-shadow-2xl" />
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="w-full max-w-6xl px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 flex flex-col items-center text-center">
          <CheckCircle className="h-10 w-10 text-blue-600 mb-2" />
          <h3 className="font-bold text-lg mb-1">Gestion des tickets</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Créez, suivez et résolvez vos incidents en temps réel, avec notifications et historique détaillé.</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 flex flex-col items-center text-center">
          <Zap className="h-10 w-10 text-fuchsia-600 mb-2" />
          <h3 className="font-bold text-lg mb-1">Assistant IA intégré</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Bénéficiez d’une aide intelligente pour diagnostiquer et résoudre vos problèmes plus vite.</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 flex flex-col items-center text-center">
          <BarChart2 className="h-10 w-10 text-cyan-600 mb-2" />
          <h3 className="font-bold text-lg mb-1">Tableaux de bord dynamiques</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Visualisez l’état de votre IT avec des graphiques interactifs et des indicateurs de performance.</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 flex flex-col items-center text-center">
          <Users className="h-10 w-10 text-emerald-600 mb-2" />
          <h3 className="font-bold text-lg mb-1">Gestion des utilisateurs</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Centralisez la gestion des accès, des rôles et des profils pour toute votre organisation.</p>
        </div>
      </section>

      {/* Avantages */}
      <section className="w-full max-w-6xl px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-blue-100/60 via-fuchsia-100/40 to-cyan-100/60 dark:from-zinc-800/60 dark:via-zinc-900/40 dark:to-zinc-800/60 rounded-xl p-6 shadow-inner flex flex-col items-center text-center">
          <HelpCircle className="h-8 w-8 text-blue-700 mb-2" />
          <h4 className="font-semibold mb-1">Support & accompagnement</h4>
          <p className="text-gray-700 dark:text-gray-200 text-sm">Une équipe à votre écoute pour vous aider à chaque étape.</p>
        </div>
        <div className="bg-gradient-to-br from-blue-100/60 via-fuchsia-100/40 to-cyan-100/60 dark:from-zinc-800/60 dark:via-zinc-900/40 dark:to-zinc-800/60 rounded-xl p-6 shadow-inner flex flex-col items-center text-center">
          <MessageCircle className="h-8 w-8 text-fuchsia-700 mb-2" />
          <h4 className="font-semibold mb-1">Collaboration simplifiée</h4>
          <p className="text-gray-700 dark:text-gray-200 text-sm">Travaillez en équipe, partagez les informations et suivez l’avancement en temps réel.</p>
        </div>
        <div className="bg-gradient-to-br from-blue-100/60 via-fuchsia-100/40 to-cyan-100/60 dark:from-zinc-800/60 dark:via-zinc-900/40 dark:to-zinc-800/60 rounded-xl p-6 shadow-inner flex flex-col items-center text-center">
          <BarChart2 className="h-8 w-8 text-cyan-700 mb-2" />
          <h4 className="font-semibold mb-1">Analyse & reporting</h4>
          <p className="text-gray-700 dark:text-gray-200 text-sm">Des rapports clairs pour piloter votre activité et prendre les bonnes décisions.</p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="w-full max-w-6xl px-4 md:px-8 py-10">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-fuchsia-300">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-blue-100 dark:bg-zinc-800 text-blue-700 font-bold w-10 h-10 flex items-center justify-center mb-2">1</span>
            <h5 className="font-semibold mb-1">Créez un compte</h5>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Inscrivez-vous en quelques clics et accédez à votre espace personnalisé.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-fuchsia-100 dark:bg-zinc-800 text-fuchsia-700 font-bold w-10 h-10 flex items-center justify-center mb-2">2</span>
            <h5 className="font-semibold mb-1">Gérez vos tickets</h5>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Déclarez, suivez et résolvez vos incidents facilement.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-cyan-100 dark:bg-zinc-800 text-cyan-700 font-bold w-10 h-10 flex items-center justify-center mb-2">3</span>
            <h5 className="font-semibold mb-1">Analysez & améliorez</h5>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Consultez vos statistiques et optimisez votre gestion IT.</p>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="w-full max-w-6xl px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-blue-700">+1200</span>
          <span className="text-gray-700 dark:text-gray-200 text-sm">Tickets résolus</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-fuchsia-700">99%</span>
          <span className="text-gray-700 dark:text-gray-200 text-sm">Satisfaction client</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-cyan-700">24/7</span>
          <span className="text-gray-700 dark:text-gray-200 text-sm">Support disponible</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-emerald-700">+50</span>
          <span className="text-gray-700 dark:text-gray-200 text-sm">Entreprises clientes</span>
        </div>
      </section>

      {/* Contact/Appel à l’action */}
      <section className="w-full max-w-6xl px-4 md:px-8 py-10 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-fuchsia-300">Prêt à optimiser votre IT ?</h2>
        <a href="/signup" className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 text-white font-semibold shadow-lg hover:scale-105 transition text-lg">Créer mon compte</a>
        <p className="text-xs text-gray-500 mt-8 text-center">Réalisé par <span className="font-bold text-blue-700">Mehdi Chmiti</span> et <span className="font-bold text-fuchsia-700">Ismail Haddaoui</span></p>
      </section>
    </main>
  );
}
