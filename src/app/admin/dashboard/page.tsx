import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatDateTime, cn } from '@/lib/utils'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, CheckSquare, Clock, Plus, ScrollText } from 'lucide-react'
import { RecentElections } from '@/components/dashboard/RecentElections'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Election, Candidate, AuditLog } from '@/types/database.types'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const { profile } = await requireRole(['super_admin', 'election_admin'])
  const supabase = await createClient()


  const electionsQuery = supabase
    .from('elections')
    .select('id, title, status, voting_start, voting_end')
    .order('created_at', { ascending: false })
    .limit(5)

  const candidatesQuery = supabase
    .from('candidates')
    .select('id, status, elections!inner(institution_id)')
    .eq('status', 'pending')

  const auditQuery = supabase
    .from('audit_logs')
    .select('id, action, created_at, metadata')
    .order('created_at', { ascending: false })
    .limit(6)

  if (profile.role !== 'super_admin') {
    electionsQuery.eq('institution_id', profile.institution_id!)
    candidatesQuery.eq('elections.institution_id', profile.institution_id!)
    auditQuery.eq('institution_id', profile.institution_id!)
  }

  const [electionsRes, candidatesRes, auditRes] = await Promise.all([
    electionsQuery as any as Promise<{ data: Election[] | null }>,
    candidatesQuery as any as Promise<{ data: Candidate[] | null }>,
    auditQuery as any as Promise<{ data: AuditLog[] | null }>,
  ])

  const elections   = electionsRes.data  ?? []
  const pending     = candidatesRes.data ?? []
  const auditEvents = auditRes.data      ?? []

  const stats = [
    { label: 'Total Elections', value: elections.length, icon: LayoutDashboard, href: '/admin/elections' },
    { label: 'Active Elections', value: elections.filter(e => e.status === 'active').length, icon: Clock, href: '/admin/elections' },
    { label: 'Pending Approvals', value: pending.length, icon: CheckSquare, href: '/admin/candidates', alert: pending.length > 0 },
  ]

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="Institutional Command"
        description={`Active Surveillance — Officer: ${profile.full_name}`}
        actions={
          <Link href="/admin/elections/new">
            <Button className="rounded-xl h-11 md:h-12 px-6 md:px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/10 group hover:scale-105 transition-all text-xs">
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-500" />
              INITIATE MANDATE
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-8 md:space-y-12 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
          {stats.map((s, idx) => (
            <Link 
              key={s.label} 
              href={s.href} 
              className={cn(
                "block",
                idx === stats.length - 1 && stats.length % 2 !== 0 && "col-span-2 md:col-span-1"
              )}
            >
              <StatsCard
                label={s.label}
                value={s.value}
                icon={s.icon}
                description={s.label === 'Pending Approvals' && s.value > 0 ? 'Urgent verification required for candidate credentials.' : undefined}
                trend={s.label === 'Total Elections' ? { value: 12, isPositive: true } : undefined}
              />
            </Link>
          ))}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
          {/* Recent Elections List */}
          <Card className="xl:col-span-2 border-border/40 shadow-2xl shadow-black/5 overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/40 border-b border-border/40 px-6 md:px-8 py-5 md:py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <CardTitle className="text-lg font-black tracking-tight">Electoral Registry</CardTitle>
                   <CardDescription className="text-[9px] font-bold uppercase tracking-widest opacity-60">System-wide monitoring of verified mandates</CardDescription>
                </div>
                <Link href="/admin/elections">
                   <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">EXPLORE ARCHIVE →</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <RecentElections elections={elections} />
            </CardContent>
          </Card>

          {/* Activity Feed Sidebar */}
          <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden flex flex-col xl:min-h-[800px]">
            <CardHeader className="bg-muted/40 border-b border-border/40 p-6 md:p-8">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <ScrollText className="w-4 h-4 text-white" />
                 </div>
                 <div className="space-y-0.5">
                    <CardTitle className="text-base font-black tracking-tight">Institutional Log</CardTitle>
                    <CardDescription className="text-[9px] font-bold uppercase tracking-widest opacity-60">Real-time cryptographic audit trail</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 flex-1">
              <ActivityFeed activities={auditEvents as any} />
            </CardContent>
            <div className="p-6 md:p-8 pt-0 bg-muted/20 border-t border-border/40">
               <Link href="/admin/audit" className="w-full">
                  <Button variant="outline" className="w-full h-11 md:h-12 rounded-xl font-black uppercase text-[10px] tracking-widest bg-background border-border/40 shadow-sm hover:bg-muted/50 transition-all">
                    COMPLETE SYSTEM AUDIT TRAIL →
                  </Button>
               </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}