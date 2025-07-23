"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { loginClient } from "@/lib/auth-client"
import React, { useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { useToast } from "@/components/ui/use-toast"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import Image from "next/image"

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Signing In..." : "Sign In"}
    </Button>
  )
}

export default function LoginPage() {
  const { toast } = useToast()
  const [state, setState] = useState<{ error?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const validate = (email: string, password: string) => {
    const errors: { email?: string; password?: string } = {}
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.email = "Invalid email address."
    if (!password || password.length < 8) errors.password = "Password must be at least 8 characters."
    return errors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setState(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const errors = validate(email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setLoading(false)
      return
    }
    try {
      const result = await loginClient({ email, password })
      if (result?.error) {
        setState({ error: result.error })
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login Successful",
          description: "You are now logged in.",
        })
        // Récupère le profil pour déterminer le rôle
        const supabase = (await import("@/lib/supabase/client")).getSupabaseBrowserClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          toast({
            title: "Login Error",
            description: userError?.message || "User not found after login.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profileError) {
          toast({
            title: "Profile Error",
            description: profileError.message || "Could not fetch user profile.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        if (profile?.role === "admin") {
          window.location.href = "/admin/dashboard"
        } else if (profile?.role === "technician") {
          window.location.href = "/technician/dashboard"
        } else {
          window.location.href = "/client/dashboard"
        }
      }
    } catch (err: any) {
      setState({ error: err.message || "Unknown error" })
      toast({
        title: "Login Failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Dégradé animé en fond */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
        {/* Bloc formulaire */}
        <div className="flex-1 flex flex-col items-center md:items-start">
          <Card className="w-full max-w-md backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 rounded-3xl shadow-2xl border border-white/30 dark:border-zinc-800/40">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent">Connexion</CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-200">Entrez votre email et mot de passe pour accéder à votre compte.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby="email-error"
                    autoComplete="username"
                    onChange={e => {
                      const value = e.target.value
                      setFieldErrors(errors => ({ ...errors, email: validate(value, "").email }))
                    }}
                  />
                  {fieldErrors.email && <span id="email-error" className="text-xs text-destructive">{fieldErrors.email}</span>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby="password-error"
                      autoComplete="current-password"
                      onChange={e => {
                        const value = e.target.value
                        setFieldErrors(errors => ({ ...errors, password: validate("", value).password }))
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-2 top-2 text-xs text-muted-foreground"
                      tabIndex={0}
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">Minimum 8 caractères.</span>
                  {fieldErrors.password && <span id="password-error" className="text-xs text-destructive">{fieldErrors.password}</span>}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 transition-all text-lg rounded-full shadow-lg" type="submit" disabled={loading} aria-busy={loading} aria-live="polite">
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </Button>
                {state?.error && <div className="text-sm text-destructive text-center">{state.error}</div>}
                <p className="text-sm text-muted-foreground">
                  Pas encore de compte ? {" "}
                  <Link href="/signup" className="font-medium hover:underline text-blue-700 dark:text-fuchsia-400">
                    Créer un compte
                  </Link>
                </p>
              </CardFooter>
            </form>
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
