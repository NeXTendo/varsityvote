import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { UsersTable } from '@/components/admin/users/UsersTable'
import { Badge } from '@/components/ui/badge'
import { Users, ShieldCheck, UserX, UserCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'User Management' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; status?: string; q?: string; page?: string }
}) {
  const { profile } = await requireRole(['super_admin', 'election_admin'])
  const supabase = await createClient()

  const page   = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit  = 25
  const offset = (page - 1) * limit

  let query = supabase
    .from('profiles')
    .select('*, institutions(name)', { count: 'exact' })
    .eq('institution_id', profile.institution_id!)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.role)   query = (query as any).eq('role', searchParams.role)
  if (searchParams.status) query = (query as any).eq('is_active', searchParams.status === 'active')
  if (searchParams.q) {
    const q = `%${searchParams.q}%`
    query = (query as any).or(`full_name.ilike.${q},email.ilike.${q},student_id.ilike.${q}`)
  }

  const { data: users, count } = await query as any

  // Stats
  const { count: totalCount }    = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id!) as any
  const { count: activeCount }   = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id!).eq('is_active', true) as any
  const { count: candidateCount }= await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id!).eq('role', 'candidate') as any
  const { count: adminCount }    = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id!).in('role', ['election_admin', 'super_admin']) as any

  // Elections for registration dropdown
  const { data: elections } = await supabase
    .from('elections')
    .select('id, title, status')
    .eq('institution_id', profile.institution_id!)
    .in('status', ['draft', 'active'])
    .order('created_at', { ascending: false }) as any

  const totalPages = Math.ceil((count ?? 0) / limit)

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="User Registry"
        description="Manage institutional members, roles, and access credentials."
      />

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: totalCount ?? 0, icon: Users, color: 'text-foreground' },
            { label: 'Active Users', value: activeCount ?? 0, icon: UserCheck, color: 'text-green-600' },
            { label: 'Candidates', value: candidateCount ?? 0, icon: ShieldCheck, color: 'text-primary' },
            { label: 'Administrators', value: adminCount ?? 0, icon: UserX, color: 'text-orange-500' },
          ].map(stat => (
            <Card key={stat.label} className="border-border/40 shadow-lg shadow-black/5 hover:border-primary/20 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                  <p className={`text-2xl font-black tracking-tight leading-none mt-0.5 ${stat.color}`}>{stat.value.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table (client component for interactivity) */}
        <UsersTable
          users={users ?? []}
          elections={elections ?? []}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count ?? 0}
          filters={{
            role: searchParams.role,
            status: searchParams.status,
            q: searchParams.q,
          }}
          callerRole={profile.role}
        />
      </div>
    </div>
  )
}
