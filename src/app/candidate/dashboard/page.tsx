import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { STATUS_COLOR, STATUS_LABEL, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, ArrowUpRight, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Candidate, Election } from '@/types/database.types'

export const metadata: Metadata = { title: 'Candidate Dashboard' }

export default async function CandidateDashboardPage() {
  const { profile } = await requireRole(['candidate', 'election_admin', 'super_admin'])
  const supabase = await createClient()

  const { data: candidacies } = await supabase
    .from('candidates')
    .select('*, elections(*), election_positions(title)')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false }) as { data: (Candidate & { elections: Election; election_positions: any })[] | null }

  const CANDIDATE_STATUS: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Pending approval', color: 'bg-yellow-100 text-yellow-800' },
    approved:  { label: 'Approved',          color: 'bg-green-100 text-green-800' },
    rejected:  { label: 'Rejected',          color: 'bg-red-100 text-red-800' },
    withdrawn: { label: 'Withdrawn',         color: 'bg-gray-100 text-gray-700' },
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="Candidate Terminal"
        description="Monitor your institutional mandates and active certified tallies."
        actions={
          <div className="flex items-center gap-3">
            <Link href="/candidate/apply">
              <Button variant="outline" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all">
                <ClipboardList className="w-4 h-4 mr-2" />
                APPLY FOR POSITION
              </Button>
            </Link>
            <Link href="/candidate/profile">
              <Button className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest shadow-2xl shadow-primary/20 group hover:scale-105 transition-all">
                CONFIGURE PROFILE
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-8 space-y-16 max-w-[1500px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {!candidacies?.length ? (
          <Card className="border-none bg-muted/20 shadow-none h-[400px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center p-20 text-center space-y-8">
              <div className="opacity-40 space-y-4">
                <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center shadow-xl shadow-black/5 mx-auto">
                   <LayoutDashboard className="w-10 h-10 stroke-[1.2]" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black uppercase tracking-[0.3em]">No Active Mandates</h3>
                   <p className="text-sm font-medium max-w-sm mx-auto italic">
                     You have not yet applied for any position. Browse open elections to get started.
                   </p>
                </div>
              </div>
              <Link href="/candidate/apply">
                <Button className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  BROWSE OPEN POSITIONS
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {candidacies.map((c, index) => {
              const el = c.elections as any
              const isApproved = c.status === 'approved'

              return (
                <Card key={c.id} className="group relative overflow-hidden transition-all duration-700 hover:-translate-y-2 border-border/40 shadow-xl shadow-black/2 bg-background animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-10 space-y-8 relative">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <Badge variant={isApproved ? 'success' : 'secondary'} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                   {c.status}
                                </Badge>
                                <div className="h-px w-8 bg-border/40" />
                                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">MANDATE: {el?.id.slice(0, 12)}</span>
                             </div>
                             <h2 className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500 uppercase">
                               {el?.title}
                             </h2>
                          </div>
                          
                          <div className="inline-flex items-center gap-4 rounded-2xl bg-muted/30 px-6 py-3 border border-border/40 shadow-inner">
                             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">POSITION:</span>
                             <span className="text-sm font-black text-foreground uppercase tracking-tight">{(c as any).election_positions?.title ?? '—'}</span>
                          </div>
                       </div>

                       {isApproved && el?.results_visible && (
                         <div className="text-center p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 shadow-2xl shadow-primary/5 min-w-[160px] group-hover:scale-105 transition-transform duration-700">
                           <p className="text-6xl font-black tracking-tighter text-primary leading-none">{c.vote_count}</p>
                           <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] mt-3">CERTIFIED VOTES</p>
                         </div>
                       )}
                    </div>

                    {c.bio && (
                      <div className="space-y-4 pt-8 border-t border-border/20">
                        <div className="flex items-center gap-3">
                           <div className="w-1 bg-primary h-4 rounded-full" />
                           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Institutional Briefing</p>
                        </div>
                        <p className="text-xs font-bold leading-relaxed text-muted-foreground italic line-clamp-4 max-w-2xl">
                          "{c.bio}"
                        </p>
                      </div>
                    )}

                    <div className="pt-10 flex items-center justify-between border-t border-border/20">
                       <div className="flex items-center gap-4">
                          <div className={cn("h-3 w-3 rounded-full shadow-lg", el?.status === 'active' ? "bg-green-500 shadow-green-500/50 animate-pulse" : "bg-muted")} />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 py-1.5 bg-muted/40 rounded-full border border-border/10">
                            {(STATUS_LABEL as any)[el?.status] || 'STATUS UNKNOWN'}
                          </span>
                       </div>
                       <Link href={`/candidate/profile`}>
                         <Button variant="ghost" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-3 hover:bg-primary/5 hover:text-primary transition-all">
                           CREDENTIALS HUB <ArrowUpRight className="w-4 h-4" />
                         </Button>
                       </Link>
                    </div>
                  </CardContent>
                  
                  <div className={cn(
                    "absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-1000",
                    isApproved ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  )} />
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}