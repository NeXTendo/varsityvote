import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as any as { data: { role: string } | null }

  const roleHome: Record<string, string> = {
    super_admin:    '/super-admin/dashboard',
    election_admin: '/admin/dashboard',
    candidate:      '/candidate/dashboard',
    voter:          '/voter/elections',
  }

  redirect(roleHome[profile?.role ?? 'voter'])
}