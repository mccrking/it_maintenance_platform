"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Profile } from "@/types/database"

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = await getSupabaseServerClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    console.error("Login error:", signInError.message)
    return { error: signInError.message }
  }

  revalidatePath("/")
  redirect("/client/dashboard")
}

export async function signup(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = await getSupabaseServerClient()

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  })

  if (signUpError) {
    console.error("Signup error:", signUpError.message)
    return { error: signUpError.message }
  }

  revalidatePath("/")
  redirect("/login?message=Check email to verify account")
}

export async function logout() {
  const supabase = await getSupabaseServerClient()
  const { error: signOutError } = await supabase.auth.signOut()

  if (signOutError) {
    console.error("Logout error:", signOutError.message)
    return { error: signOutError.message }
  }

  revalidatePath("/")
  redirect("/login")
}

export async function getUserSession() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profileError) {
    console.error("Error fetching profile:", profileError.message)
    return null
  }

  return profile
}

export async function updateUserProfile(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const fullName = formData.get("full_name") as string
  const username = formData.get("username") as string

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username: username, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (updateError) {
    console.error("Error updating profile:", updateError.message)
    return { error: updateError.message }
  }

  revalidatePath("/settings/profile")
  revalidatePath("/app-sidebar")
  return { success: "Profile updated successfully!" }
}
