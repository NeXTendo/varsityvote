import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  Building2, 
  Mail,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'User Authority | Super Admin' }

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  election_admin: 'bg-primary/10 text-primary border-primary/20',
  candidate: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  voter: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

interface PageProps {
  searchParams: {
    q?: string
    role?: string
    institution?: string
  }
}

export default async function SuperAdminUsersPage({ searchParams }: PageProps) {
  await requireRole(['super_admin'])
  const supabase = await createClient()

  const query = searchParams.q || ''
  const roleFilter = searchParams.role || ''

  let profilesQuery = supabase
    .from('profiles')
    .select('*, institutions(name)')
    .order('full_name')

  if (query) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
  }
  
  if (roleFilter && roleFilter !== 'all') {
    profilesQuery = profilesQuery.eq('role', roleFilter)
  }

  const [profilesRes, institutionsRes] = await Promise.all([
    profilesQuery as any,
    supabase
      .from('institutions')
      .select('id, name')
      .eq('is_active', true)
      .order('name') as any
  ])

  const profiles = profilesRes.data ?? []
  const institutions = institutionsRes.data ?? []

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Authority Management" 
        description="Oversee administrative privileges and institutional access across the system."
        actions={<CreateUserDialog institutions={institutions} />}
      />

      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card className="border-border/40 shadow-xl shadow-black/5 bg-background">
              <CardContent className="p-6 space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Authorities</p>
                 <p className="text-3xl font-black tracking-tighter">{profiles.length}</p>
              </CardContent>
           </Card>
           <Card className="border-border/40 shadow-xl shadow-black/5 bg-background">
              <CardContent className="p-6 space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Super Admins</p>
                 <p className="text-3xl font-black tracking-tighter text-red-500">
                    {profiles.filter((p: any) => p.role === 'super_admin').length}
                 </p>
              </CardContent>
           </Card>
           <Card className="border-border/40 shadow-xl shadow-black/5 bg-background">
              <CardContent className="p-6 space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Election Admins</p>
                 <p className="text-3xl font-black tracking-tighter text-primary">
                    {profiles.filter((p: any) => p.role === 'election_admin').length}
                 </p>
              </CardContent>
           </Card>
           <Card className="border-border/40 shadow-xl shadow-black/5 bg-background">
              <CardContent className="p-6 space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">System Voters</p>
                 <p className="text-3xl font-black tracking-tighter text-emerald-500">
                    {profiles.filter((p: any) => p.role === 'voter').length}
                 </p>
              </CardContent>
           </Card>
        </div>

        {/* Filters */}
        <form className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                name="q"
                defaultValue={query}
                placeholder="Search by name or email authority..." 
                className="pl-11 rounded-xl border-border/40 bg-background h-12 shadow-sm focus:ring-primary/20"
              />
           </div>
           <select 
             name="role"
             title="Select Role Authority"
             defaultValue={roleFilter}
             className="h-12 px-4 rounded-xl border-border/40 bg-background text-sm font-bold uppercase tracking-widest appearance-none min-w-[200px] shadow-sm cursor-pointer focus:ring-primary/20 outline-none"
           >
              <option value="all">ALL PRIVILEGES</option>
              <option value="super_admin">SUPER ADMIN</option>
              <option value="election_admin">ELECTION ADMIN</option>
              <option value="candidate">CANDIDATE</option>
              <option value="voter">VOTER</option>
           </select>
           <Button type="submit" className="h-12 rounded-xl font-black px-8">
              <Filter className="w-4 h-4 mr-2" /> APPLY FILTERS
           </Button>
           {(query || roleFilter) && (
             <Link href="/super-admin/users">
                <Button type="button" variant="ghost" className="h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest">RESET</Button>
             </Link>
           )}
        </form>

        {/* Users Table */}
        <div className="rounded-2xl border border-border/40 bg-background shadow-2xl shadow-black/5 overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted opacity-80 border-b border-border/40">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Designation</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Institutional Access</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {profiles.length > 0 ? (
                profiles.map((user: any) => (
                  <tr key={user.id} className="group hover:bg-muted/30 transition-all duration-300">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-black text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500">
                          {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{user.full_name || 'Unnamed Authority'}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 opacity-60">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest border shadow-sm", ROLE_COLORS[user.role] || 'bg-muted text-muted-foreground')}>
                        <Shield className="w-3 h-3 mr-1.5" />
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                        <Building2 className="w-4 h-4 opacity-40" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">
                          {user.institutions?.name || 'GLOBAL SYSTEM'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/super-admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-lg h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Users className="w-12 h-12" />
                      <p className="text-sm font-black uppercase tracking-widest">No matching authorities found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
