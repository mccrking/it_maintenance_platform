"use server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/audit"
import { revalidatePath } from "next/cache"
export async function updateUserProfile(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { error: "Unauthorized" };
  }
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (profileError || currentProfile?.role !== "admin") {
    return { error: "Permission denied. Only admins can update user profiles." };
  }
  const userId = formData.get("userId") as string;
  const full_name = formData.get("full_name") as string;
  const username = formData.get("username") as string;
  const role = formData.get("role") as string;
  if (!userId || !full_name || !username || !role) {
    return { error: "All fields are required." };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ full_name, username, role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    console.error("Error updating user profile:", error);
    return { error: "Failed to update user profile." };
  }
  await logAuditEvent({
    userId: currentUser.id,
    action: "update_user_profile",
    details: `Updated user ${userId}: ${full_name}, ${username}, ${role}`,
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { error: "Unauthorized" };
  }
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (profileError || currentProfile?.role !== "admin") {
    return { error: "Permission denied. Only admins can delete users." };
  }
  const userId = formData.get("userId") as string;
  if (!userId) {
    return { error: "User ID is required." };
  }
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (error) {
    console.error("Error deleting user:", error);
    return { error: "Failed to delete user." };
  }
  await logAuditEvent({
    userId: currentUser.id,
    action: "delete_user",
    details: `Deleted user ${userId}`,
  });
  revalidatePath("/admin/users");
  return { success: true };
}



export async function updateUserRole(prevState: any, formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single()

  if (profileError || currentProfile?.role !== "admin") {
    return { error: "Permission denied. Only admins can update user roles." }
  }

  const userId = formData.get("userId") as string
  const newRole = formData.get("newRole") as string

  if (!userId || !newRole) {
    return { error: "User ID and new role are required." }
  }

  const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

  if (error) {
    console.error("Error updating user role:", error)
    return { error: "Failed to update user role." }
  }

  // Audit log: record user role change
  await logAuditEvent({
    userId: currentUser.id,
    action: "update_user_role",
    details: `Changed role for user ${userId} to ${newRole}`,
  })

  revalidatePath("/admin/users")
  return { success: true }
}
