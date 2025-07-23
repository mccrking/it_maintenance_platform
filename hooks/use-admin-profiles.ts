import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"

export function useAdminProfiles(refresh?: any) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function fetchProfiles() {
      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabaseBrowserClient()
        // Utilise la vue SQL pour récupérer l'email
        const { data, error } = await supabase.from("profiles_with_email").select("id, full_name, username, role, avatar_url, email")
        if (error) throw error
        if (isMounted) setProfiles(data || [])
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to fetch profiles")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProfiles()
    return () => {
      isMounted = false
    }
  }, [refresh])

  return { profiles, loading, error }
}
