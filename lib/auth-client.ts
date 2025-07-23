import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// Version client pour login (appelée depuis un composant React côté client)
export async function loginClient({ email, password }: { email: string; password: string }) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}

// Version client pour signup (appelée depuis un composant React côté client)
export async function signupClient({ name, email, password }: { name: string; email: string; password: string }) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  })
  if (error) {
    console.error('Supabase signup error:', error)
    return { error: error.message }
  }
  return { success: true }
}
