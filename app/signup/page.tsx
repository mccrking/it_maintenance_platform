"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signupClient } from "@/lib/auth-client"
import React, { useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

function SignupButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Signing Up..." : "Sign Up"}
    </Button>
  )
}

  function SignupPage() {
    const { toast } = useToast()
    const [state, setState] = useState<{ error?: string } | null>(null)
    const [loading, setLoading] = useState(false)
  
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<string>("")

  const validate = (name: string, email: string, password: string) => {
    const errors: { name?: string; email?: string; password?: string } = {}
    if (!name || name.length < 2) errors.name = "Name must be at least 2 characters."
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.email = "Invalid email address."
    let strength = 0
    if (password && password.length >= 8) strength++
    if (password && /[A-Z]/.test(password)) strength++
    if (password && /[a-z]/.test(password)) strength++
    if (password && /[0-9]/.test(password)) strength++
    if (password && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) strength++
    if (!password || password.length < 8) errors.password = "Password must be at least 8 characters."
    if (password && !/[A-Z]/.test(password)) errors.password = "Password must contain an uppercase letter."
    if (password && !/[a-z]/.test(password)) errors.password = "Password must contain a lowercase letter."
    if (password && !/[0-9]/.test(password)) errors.password = "Password must contain a number."
    if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) errors.password = "Password must contain a special character."
    setPasswordStrength(strength <= 2 ? "Weak" : strength <= 4 ? "Medium" : "Strong")
    return errors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setState(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const errors = validate(name, email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setLoading(false)
      return
    }
    try {
      const result = await signupClient({ name, email, password })
      if (result?.error) {
        setState({ error: result.error })
        toast({
          title: "Signup Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signup Successful",
          description: "Your account has been created.",
        })
        window.location.href = "/login?message=Check email to verify account"
      }
    } catch (err: any) {
      setState({ error: err.message || "Unknown error" })
      toast({
        title: "Signup Failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
    return (
      <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Switch de thème en haut à droite */}
        <div className="absolute top-6 right-8 z-20">
          <ThemeSwitcher />
        </div>
        {/* Dégradé animé en fond */}
        <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-cyan-400 opacity-80 blur-[2px]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl mx-auto animate-fade-in-up">
          {/* Bloc formulaire */}
          <div className="flex-1 flex flex-col items-center md:items-start">
            <Card className="w-full max-w-md backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 rounded-3xl shadow-2xl border border-white/30 dark:border-zinc-800/40">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-700 via-fuchsia-600 to-cyan-400 bg-clip-text text-transparent">Créer un compte</CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">Rejoignez la plateforme et gérez vos tickets IT en toute simplicité.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" name="name" type="text" placeholder="John Doe" required aria-invalid={!!fieldErrors.name} aria-describedby="name-error" />
                    {fieldErrors.name && <span id="name-error" className="text-xs text-destructive">{fieldErrors.name}</span>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required aria-invalid={!!fieldErrors.email} aria-describedby="email-error" />
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
                        aria-describedby="password-error strength-indicator"
                        autoComplete="new-password"
                        onChange={e => {
                          const value = e.target.value
                          validate("", "", value)
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
                    <span id="strength-indicator" className={`text-xs ${passwordStrength === "Strong" ? "text-green-600" : passwordStrength === "Medium" ? "text-yellow-600" : "text-destructive"}`}>Force : {passwordStrength}</span>
                    <span className="text-xs text-muted-foreground">Minimum 8 caractères, majuscule, minuscule, chiffre, caractère spécial.</span>
                    {fieldErrors.password && <span id="password-error" className="text-xs text-destructive">{fieldErrors.password}</span>}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 transition-all text-lg rounded-full shadow-lg" type="submit" disabled={loading} aria-busy={loading} aria-live="polite">
                    {loading ? "Création du compte..." : "Créer un compte"}
                  </Button>
                  {state?.error && <div className="text-sm text-destructive text-center">{state.error}</div>}
                  <p className="text-sm text-muted-foreground">
                    Déjà inscrit ? {" "}
                    <Link href="/login" className="font-medium hover:underline text-blue-700 dark:text-fuchsia-400">
                      Se connecter
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
          {/* Illustration moderne à droite */}
          <div className="hidden md:flex flex-1 justify-center items-center ml-8">
            <Image src="/logo-it-maintenance.svg" alt="Illustration IT" width={260} height={260} className="drop-shadow-2xl animate-float" />
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
  
  export default SignupPage

