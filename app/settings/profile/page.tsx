"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateUserProfile } from "@/lib/auth"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"

function UpdateProfileButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}

export default function ProfileSettingsPage() {
  // Inline validation and accessibility improvements
  const [fieldErrors, setFieldErrors] = useState<{ full_name?: string; username?: string }>({})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [state, formAction] = useActionState(updateUserProfile, undefined)
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      const { data: user, error: userError } = await supabase.auth.getUser()
      if (userError || !user.user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view your profile.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.user.id).single()
      if (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        })
      } else {
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [supabase, toast])

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Success",
        description: state.success,
      })
    } else if (state?.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, toast])

  if (loading) {
    return (
      <div className="text-center py-10" aria-busy="true" aria-live="polite" role="status">
        Loading profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-10 text-destructive" role="alert" aria-live="assertive">
        Profile not found.
      </div>
    )
  }

  // ...existing code...

  const validate = (full_name: string, username: string) => {
    const errors: { full_name?: string; username?: string } = {}
    if (!full_name || full_name.length < 2) errors.full_name = "Full name must be at least 2 characters."
    if (!username || username.length < 2) errors.username = "Username must be at least 2 characters."
    return errors
  }

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4" role="main">
      <Card className="w-full max-w-md" role="region" aria-label="Profile Settings">
        <CardHeader>
          <CardTitle className="text-2xl" tabIndex={0}>Profile Settings</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={profile.full_name || ""}
                aria-invalid={!!fieldErrors.full_name}
                aria-describedby="full_name-error"
                onChange={e => {
                  const value = e.target.value
                  setFieldErrors(errors => ({ ...errors, full_name: validate(value, profile.username || "").full_name }))
                }}
              />
              {fieldErrors.full_name && <span id="full_name-error" className="text-xs text-destructive">{fieldErrors.full_name}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                defaultValue={profile.username || ""}
                aria-invalid={!!fieldErrors.username}
                aria-describedby="username-error"
                onChange={e => {
                  const value = e.target.value
                  setFieldErrors(errors => ({ ...errors, username: validate(profile.full_name || "", value).username }))
                }}
              />
              {fieldErrors.username && <span id="username-error" className="text-xs text-destructive">{fieldErrors.username}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={profile.id} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" type="text" defaultValue={profile.role} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">Your role is managed by administrators.</p>
            </div>
          </CardContent>
          <CardFooter>
            <UpdateProfileButton />
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
