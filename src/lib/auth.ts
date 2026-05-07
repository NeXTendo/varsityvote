import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, UserRole } from '@/types/database.types'

/** Get session + profile. Redirects to /login if unauthenticated. */
export async function requireAuth(): Promise<{ userId: string; profile: Profile }> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return { userId: user.id, profile }
}

/** Require a specific role or redirect to role home. */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ userId: string; profile: Profile }> {
  const { userId, profile } = await requireAuth()

  if (!allowedRoles.includes(profile.role)) {
    const roleHome: Record<UserRole, string> = {
      super_admin:    '/super-admin/dashboard',
      election_admin: '/admin/dashboard',
      candidate:      '/candidate/dashboard',
      voter:          '/voter/elections',
    }
    redirect(roleHome[profile.role])
  }

  return { userId, profile }
}

/** Client-side: get current user's profile from Supabase */
export async function getProfile(supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}