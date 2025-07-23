"use client"

import { Home, Inbox, Search, Settings, User, Wrench, BarChart, LogOut, ChevronUp, PlusCircle, DollarSign, Package, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth"
import type { Profile } from "@/types/database"

interface AppSidebarProps {
  userProfile: Profile | null
}

export function AppSidebar({ userProfile }: AppSidebarProps) {
  const pathname = usePathname()
  const currentUserRole = userProfile?.role || "guest"
  const currentUserName = userProfile?.full_name || userProfile?.username || "Guest"

  const clientItems = [
    {
      title: "Dashboard",
      url: "/client/dashboard",
      icon: Home,
    },
    {
      title: "Submit Ticket",
      url: "/client/submit-ticket",
      icon: PlusCircle,
    },
    {
      title: "My Tickets",
      url: "/client/my-tickets",
      icon: Inbox,
    },
    {
      title: "Diagnostic",
      url: "/diagnostic",
      icon: Search,
    },
    {
      title: "Finance",
      url: "/client/finance",
      icon: DollarSign,
    },
    {
      title: "Planning",
      url: "/planning",
      icon: Calendar,
    },
  ]

  const technicianItems = [
    {
      title: "Dashboard",
      url: "/technician/dashboard",
      icon: Home,
    },
    {
      title: "Assigned Tickets",
      url: "/technician/assigned-tickets",
      icon: Wrench,
    },
    {
      title: "All Tickets",
      url: "/technician/all-tickets",
      icon: Inbox,
    },
    {
      title: "Diagnostic",
      url: "/diagnostic",
      icon: Search,
    },
  ]

  const adminItems = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: Home,
    },
    {
      title: "Manage Tickets",
      url: "/admin/tickets",
      icon: Inbox,
    },
    {
      title: "Manage Users",
      url: "/admin/users", // Placeholder for user management page
      icon: User,
    },
    {
      title: "Reports & Analytics",
      url: "/admin/reports", // Placeholder for reports page
      icon: BarChart,
    },
    {
      title: "Diagnostic",
      url: "/diagnostic",
      icon: Search,
    },
    {
      title: "Finance",
      url: "/admin/finance",
      icon: DollarSign,
    },
    {
      title: "Matériel",
      url: "/admin/material",
      icon: Package,
    },
    {
      title: "Planning",
      url: "/planning",
      icon: Calendar,
    },
  ]

  const getMenuItems = (role: string) => {
    switch (role) {
      case "client":
        return clientItems
      case "technician":
        return technicianItems
      case "admin":
        return adminItems
      default:
        return []
    }
  }

  const menuItems = getMenuItems(currentUserRole)

  return (
    <Sidebar className="fixed top-0 left-0 h-screen w-[260px] z-40 bg-gradient-to-b from-blue-50/80 via-fuchsia-50/60 to-cyan-50/80 dark:from-zinc-900/80 dark:via-zinc-800/60 dark:to-zinc-900/80 shadow-xl rounded-r-3xl border-r border-white/30 dark:border-zinc-800/40 backdrop-blur-xl flex flex-col">
      {/* Logo sticky en haut */}
      <div className="flex flex-col items-center py-6 sticky top-0 z-20 bg-gradient-to-b from-blue-50/80 via-fuchsia-50/60 to-cyan-50/80 dark:from-zinc-900/80 dark:via-zinc-800/60 dark:to-zinc-900/80 backdrop-blur-xl">
        <Image src="/logo-it-maintenance.svg" alt="Logo IT" width={56} height={56} className="mb-1 animate-float drop-shadow-xl" />
        <span className="font-extrabold text-base bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent">IT Platform</span>
      </div>
      {/* Navigation scrollable */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar py-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {userProfile ? (
          <>
            <div className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Navigation</div>
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.title}>
                  <Link href={item.url} className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all group hover:bg-gradient-to-r hover:from-blue-100 hover:to-fuchsia-100 dark:hover:from-zinc-800 dark:hover:to-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-400 ${pathname?.startsWith(item.url) ? "bg-gradient-to-r from-blue-200 to-fuchsia-100 dark:from-zinc-800 dark:to-zinc-900 shadow-md" : ""}`}> 
                    <item.icon className="h-5 w-5 text-blue-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Général</div>
            <ul className="space-y-2">
              <li>
                <Link href="/settings" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all group hover:bg-gradient-to-r hover:from-blue-100 hover:to-fuchsia-100 dark:hover:from-zinc-800 dark:hover:to-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-400 ${pathname?.startsWith("/settings") ? "bg-gradient-to-r from-blue-200 to-fuchsia-100 dark:from-zinc-800 dark:to-zinc-900 shadow-md" : ""}`}> 
                  <Settings className="h-5 w-5 text-blue-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Paramètres</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all group hover:bg-gradient-to-r hover:from-blue-100 hover:to-fuchsia-100 dark:hover:from-zinc-800 dark:hover:to-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-400 ${pathname?.startsWith("/search") ? "bg-gradient-to-r from-blue-200 to-fuchsia-100 dark:from-zinc-800 dark:to-zinc-900 shadow-md" : ""}`}> 
                  <Search className="h-5 w-5 text-blue-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Recherche</span>
                </Link>
              </li>
            </ul>
          </>
        ) : (
          <>
            <div className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Accès</div>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all group hover:bg-gradient-to-r hover:from-blue-100 hover:to-fuchsia-100 dark:hover:from-zinc-800 dark:hover:to-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-400 ${pathname === "/login" ? "bg-gradient-to-r from-blue-200 to-fuchsia-100 dark:from-zinc-800 dark:to-zinc-900 shadow-md" : ""}`}> 
                  <User className="h-5 w-5 text-blue-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Connexion</span>
                </Link>
              </li>
              <li>
                <Link href="/signup" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all group hover:bg-gradient-to-r hover:from-blue-100 hover:to-fuchsia-100 dark:hover:from-zinc-800 dark:hover:to-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-400 ${pathname === "/signup" ? "bg-gradient-to-r from-blue-200 to-fuchsia-100 dark:from-zinc-800 dark:to-zinc-900 shadow-md" : ""}`}> 
                  <PlusCircle className="h-5 w-5 text-blue-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Créer un compte</span>
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>
      {/* Footer sticky en bas */}
      <div className="sticky bottom-0 left-0 px-4 py-5 bg-gradient-to-t from-blue-50/80 via-fuchsia-50/60 to-cyan-50/80 dark:from-zinc-900/80 dark:via-zinc-800/60 dark:to-zinc-900/80 backdrop-blur-xl flex flex-col items-center gap-4 z-20 border-t border-white/20 dark:border-zinc-800/40">
        {userProfile ? (
          <div className="flex flex-col items-center w-full mb-2">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-6 w-6 text-blue-600 dark:text-fuchsia-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUserName}</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{currentUserRole}</span>
            <button onClick={() => logout()} className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline">Se déconnecter</button>
          </div>
        ) : (
          <div className="p-2 text-center text-sm text-muted-foreground">Veuillez vous connecter.</div>
        )}
        <ThemeSwitcher />
      </div>
      <style>{`
        .animate-float {
          animation: float 3s ease-in-out infinite alternate;
        }
        @keyframes float {
          0% { transform: translateY(0); }
          100% { transform: translateY(-10px); }
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #a3a3a3 #f3f3f3;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 7px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a3a3a3;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f3f3;
        }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar {
            scrollbar-color: #444 #18181b;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #444;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #18181b;
          }
        }
      `}</style>
    </Sidebar>
  )
}
