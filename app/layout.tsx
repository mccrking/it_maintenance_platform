import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"  
import { SidebarProvider, SidebarTrigger, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { cookies } from "next/headers"
import { Toaster } from "@/components/ui/toaster"
import { getUserProfile } from "@/lib/auth"
import AiAssistantClientWrapper from "@/components/ai-assistant-client-wrapper"
import DynamicMain from "./dynamic-main"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IT Maintenance Platform",
  description: "Smart IT Maintenance Management Platform",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"
  const userProfile = await getUserProfile()

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="w-full flex flex-col items-center justify-center px-6 py-4 border-b bg-white dark:bg-zinc-900">
            <img src="/logo-it-maintenance.svg" alt="IT Maintenance Logo" width={48} height={48} className="mb-2" />
            <span className="font-bold text-xl text-blue-700 dark:text-blue-300">IT Maintenance Platform</span>
            <div className="mt-2">
              <ThemeSwitcher />
            </div>
          </header>
          <SidebarProvider defaultOpen={defaultOpen}>
            {/* Bouton d'ouverture/fermeture de la sidebar (doit être dans le provider) */}
            <div className="fixed top-4 left-4 z-50 md:z-50">
              <SidebarTrigger />
            </div>
            <AppSidebar userProfile={userProfile} />
              <SidebarInset>
                {/* Padding dynamique selon l'état de la sidebar */}
                <DynamicMain>{children}</DynamicMain>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
            {/* AI Assistant floating chat */}
            <AiAssistantClientWrapper />
        </ThemeProvider>
      </body>
    </html>
  )
}
