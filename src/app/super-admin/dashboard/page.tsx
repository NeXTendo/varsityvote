import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { STATUS_COLOR, STATUS_LABEL, formatDateTime, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  FileText, 
  Settings2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  History,
  LayoutDashboard,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAuditLogs } from '@/lib/audit'
import { RegistrationTrendChart } from '@/components/admin/analytics/RegistrationTrendChart'

export const metadata: Metadata = { title: 'Super Admin Dashboard' }

export default async function SuperAdminDashboardPage() {
  const { profile } = await requireRole(['super_admin'])
  const supabase = await createClient()

  const [institutionsRes, electionsRes, usersRes, recentLogs, allProfiles] = await Promise.all([
    supabase.from('institutions').select('id, name, slug, is_active').order('name') as any,
    supabase.from('elections').select('id, title, status, institution_id, voting_start').order('created_at', { ascending: false }).limit(6) as any,
    supabase.from('profiles').select('id, role').neq('role', 'voter') as any,
    getAuditLogs({ limit: 5 }),
    supabase.from('profiles').select('created_at').order('created_at') as any
  ])

  const institutions = institutionsRes.data ?? []
  const elections    = electionsRes.data    ?? []
  const admins       = usersRes.data        ?? []
  const registrationTrend = aggregateByDate(allProfiles.data || []).slice(-7)

  const stats = [
    { label: 'Institutions',     value: institutions.length, icon: Building2, color: 'text-blue-500' },
    { label: 'Active Mandates',  value: elections.filter((e: any) => e.status === 'active').length, icon: Zap, color: 'text-amber-500' },
    { label: 'Admins & Staff',   value: admins.length, icon: ShieldCheck, color: 'text-primary' },
    { label: 'Total Elections',  value: elections.length, icon: FileText, color: 'text-indigo-500' },
  ]

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="Institutional Control"
        description="High-level oversight of all established mandates and institutional entities."
        actions={
          <div className="flex gap-3">
             <Link href="/super-admin/analytics">
                <Button variant="outline" className="rounded-xl font-black px-6 shadow-lg shadow-black/5 border-border/40 bg-background group">
                  <TrendingUp className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> ANALYTICS
                </Button>
             </Link>
             <Link href="/super-admin/institutions">
                <Button className="rounded-xl font-black px-8 shadow-lg shadow-primary/20 bg-primary">
                   <Settings2 className="w-4 h-4 mr-2" /> SYSTEM CONFIG
                </Button>
             </Link>
          </div>
        }
      />

      <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Stats & Chart */}
            <div className="lg:col-span-2 space-y-12">
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {stats.map((s) => (
                    <Card key={s.label} className="border-border/40 shadow-xl shadow-black/5 overflow-hidden group hover:-translate-y-1 transition-all duration-300 bg-background">
                       <CardContent className="p-8 flex items-center justify-between">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{s.label}</p>
                             <p className="text-4xl font-black tracking-tighter text-foreground">{s.value}</p>
                          </div>
                          <div className={cn("w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center transition-all group-hover:scale-110", s.color)}>
                             <s.icon className="w-6 h-6" />
                          </div>
                       </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Growth Chart */}
                <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden bg-background">
                   <CardHeader className="px-8 py-6 border-b border-border/40 flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                         <CardTitle className="text-sm font-black uppercase tracking-widest">System Adoption</CardTitle>
                         <CardDescription className="text-[10px] font-bold uppercase opacity-60">Identity registry trend (Last 7 days)</CardDescription>
                      </div>
                      <Link href="/super-admin/analytics">
                         <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">Details →</Button>
                      </Link>
                   </CardHeader>
                   <CardContent className="p-8">
                      <RegistrationTrendChart data={registrationTrend} />
                   </CardContent>
                </Card>

                {/* Recent Elections List */}
                <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden bg-background">
                   <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <FileText className="w-4 h-4 text-white" />
                         </div>
                         <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">Active Mandates</CardTitle>
                      </div>
                   </CardHeader>
                   <CardContent className="p-0 divide-y divide-border/40">
                      {elections.map((e: any) => (
                        <div key={e.id} className="px-8 py-5 flex items-center justify-between group hover:bg-muted/30 transition-all duration-300">
                          <div className="min-w-0 pr-4">
                            <p className="text-sm font-black tracking-tight text-foreground truncate group-hover:text-primary transition-colors">{e.title}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">Created {formatDateTime(e.voting_start || new Date().toISOString())}</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <Badge variant={e.status === 'active' ? 'success' : 'secondary'} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest shrink-0">
                               {(STATUS_LABEL as any)[e.status]}
                             </Badge>
                             <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                   </CardContent>
                </Card>
            </div>

            {/* Right Column: Activity & Institutions */}
            <div className="space-y-12">
                
                {/* Recent Activity */}
                <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden bg-background">
                   <CardHeader className="px-8 py-6 border-b border-border/40 bg-muted/40">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <History className="w-4 h-4 text-primary" />
                         </div>
                         <CardTitle className="text-sm font-black uppercase tracking-widest">Real-time Activity</CardTitle>
                      </div>
                   </CardHeader>
                   <CardContent className="p-6 space-y-6">
                      {recentLogs.map((log: any) => (
                         <div key={log.id} className="flex gap-4 items-start group">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                            <div className="space-y-1.5 min-w-0">
                               <p className="text-[11px] font-bold text-foreground leading-tight uppercase tracking-tight">
                                  <span className="text-primary font-black uppercase">{log.action.replace(/_/g, ' ')}</span> by {log.profiles?.full_name?.split(' ')[0] || 'System'}
                               </p>
                               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] opacity-40">{formatDateTime(log.created_at)}</p>
                            </div>
                         </div>
                      ))}
                      <Link href="/super-admin/audit">
                         <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-[0.2em] pt-4 border-t border-border/40 rounded-none hover:bg-transparent hover:text-primary">
                            FULL REGISTRY AUDIT →
                         </Button>
                      </Link>
                   </CardContent>
                </Card>

                {/* Institutions Quick List */}
                <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden bg-background">
                   <CardHeader className="px-8 py-6 border-b border-border/40">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                               <Building2 className="w-4 h-4 text-blue-500" />
                            </div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Entities</CardTitle>
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-0">
                      {(institutions as any[]).slice(0, 5).map((inst: any) => (
                        <div key={inst.id} className="px-8 py-4 flex items-center justify-between hover:bg-muted/30 transition-all border-b border-border/40 last:border-0">
                           <div className="min-w-0 pr-4">
                              <p className="text-[11px] font-black text-foreground truncate uppercase tracking-tight">{inst.name}</p>
                              <Badge variant={inst.is_active ? 'success' : 'outline'} className="h-4 px-1.5 text-[7px] font-black uppercase">
                                 {inst.is_active ? 'ENABLED' : 'DISABLED'}
                              </Badge>
                           </div>
                           <Link href={`/super-admin/institutions/${inst.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary">
                                 <ArrowUpRight className="w-3.5 h-3.5" />
                              </Button>
                           </Link>
                        </div>
                      ))}
                      <Link href="/super-admin/institutions">
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-none border-t border-border/40 hover:bg-transparent hover:text-primary">
                           MANAGE ALL ENTITIES
                        </Button>
                      </Link>
                   </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </div>
  )
}

function aggregateByDate(items: { created_at: string }[]) {
  const counts: Record<string, number> = {}
  items.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    counts[date] = (counts[date] || 0) + 1
  })
  
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}