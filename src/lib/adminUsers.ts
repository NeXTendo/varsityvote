'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

const USERS_PATH = '/admin/users'

// ── Helper: ensure caller is admin ───────────────────────────────────────────
async function ensureAdmin() {
  return requireRole(['super_admin', 'election_admin'])
}

// ── 1. Change Role ────────────────────────────────────────────────────────────
export async function changeUserRole(userId: string, role: UserRole) {
  await ensureAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId) as any
  if (error) return { error: error.message }
  revalidatePath(USERS_PATH)
  return { success: true }
}

// ── 2. Update Basic Info ──────────────────────────────────────────────────────
export async function updateUserInfo(userId: string, data: { full_name?: string; student_id?: string }) {
  await ensureAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId) as any
  if (error) return { error: error.message }
  revalidatePath(USERS_PATH)
  return { success: true }
}

// ── 3. Activate / Deactivate (Invalidate) User ───────────────────────────────
export async function setUserActive(userId: string, isActive: boolean) {
  await ensureAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId) as any
  if (error) return { error: error.message }
  revalidatePath(USERS_PATH)
  return { success: true }
}

// ── 4. Force Password Reset ───────────────────────────────────────────────────
export async function forcePasswordReset(userId: string) {
  await ensureAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ require_password_change: true, updated_at: new Date().toISOString() })
    .eq('id', userId) as any
  if (error) return { error: error.message }
  revalidatePath(USERS_PATH)
  return { success: true }
}

// ── 5. Delete Account ─────────────────────────────────────────────────────────
export async function deleteUserAccount(userId: string) {
  await ensureAdmin()
  const admin = await createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath(USERS_PATH)
  return { success: true }
}

// ── 6. Register User for Election (Issue Vote Token) ─────────────────────────
export async function registerUserForElection(userId: string, electionId: string) {
  await ensureAdmin()
  const admin = await createAdminClient()  // bypass RLS

  // Check not already registered
  const { data: existing } = await admin
    .from('vote_tokens')
    .select('id')
    .eq('voter_id', userId)
    .eq('election_id', electionId)
    .maybeSingle()

  if (existing) return { error: 'User is already registered for this election.' }

  const { error } = await admin
    .from('vote_tokens')
    .insert({ voter_id: userId, election_id: electionId })

  if (error) return { error: error.message }
  revalidatePath(USERS_PATH)
  return { success: true }
}

// ── 7. Impersonate / Send Magic Link ─────────────────────────────────────────
export async function sendMagicLink(email: string) {
  await ensureAdmin()
  const admin = await createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (error) return { error: error.message }
  return { success: true, link: (data as any)?.properties?.action_link }
}

// ── 8. Reset Password to Default ─────────────────────────────────────────────
export async function resetToDefaultPassword(userId: string, email: string) {
  await ensureAdmin()
  const admin = await createAdminClient()
  const defaultPassword = email.substring(0, 2) + '12345'
  const { error } = await admin.auth.admin.updateUserById(userId, { password: defaultPassword })
  if (error) return { error: error.message }
  // Also flag for password change
  const supabase = await createClient()
  await supabase.from('profiles').update({ require_password_change: true }).eq('id', userId) as any
  revalidatePath(USERS_PATH)
  return { success: true, defaultPassword }
}

// ── 9. Bulk Deactivate ────────────────────────────────────────────────────────
export async function bulkSetActive(userIds: string[], isActive: boolean) {
  await ensureAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .in('id', userIds) as any
  if (error) return { error: error.message }
  revalidatePath(USERS_PATH)
  return { success: true }
}
