import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatDateTime, getElectionTimeStatus, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, Clock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Election, VoteToken } from '@/types/database.types'

export const metadata: Metadata = { title: 'Elections' }

export default async function VoterElectionsPage() {
  const { profile } = await requireAuth()
  const supabase = await createClient()

  const { data: elections } = await supabase
    .from('elections')
    .select('*')
    .eq('institution_id', profile.institution_id!)
    .in('status', ['active', 'closed', 'results_published'])
    .order('voting_start', { ascending: false }) as { data: Election[] | null }

  // Check which elections this voter has already voted in
  const { data: usedTokens } = await supabase
    .from('vote_tokens')
    .select('election_id, used')
    .eq('voter_id', profile.id) as { data: VoteToken[] | null }

  const votedSet = new Set(
    usedTokens?.filter(t => t.used).map(t => t.election_id) ?? []
  )

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Institutional Mandates" 
        description="Review active solicitations, verify candidates, and exercise your cryptographic suffrage." 
      />

      <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {!elections?.length && (
          <Card className="border-none bg-muted/30 shadow-none overflow-hidden h-[300px] md:h-[400px] flex items-center justify-center">
            <CardContent className="text-center space-y-4 opacity-40">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] md:rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/5">
                <LayoutDashboard className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-[0.2em]">Zero Active Mandates</h3>
              <p className="text-[10px] md:text-sm font-medium max-w-sm mx-auto leading-relaxed italic">
                Your institution has no active electoral windows at this time. Please monitor official channels for updates.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:gap-10">
          {elections?.map(e => {
            const timeStatus = getElectionTimeStatus(e.voting_start, e.voting_end)
            const hasVoted   = votedSet.has(e.id)
            const canVote    = e.status === 'active' && timeStatus === 'open' && !hasVoted

            return (
              <Card key={e.id} className="border-border/40 shadow-xl shadow-black/5 overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row min-h-[220px]">
                    {/* Status Accent Strip */}
                    <div className={cn(
                      "w-full h-2 md:h-auto md:w-3 shrink-0 transition-all duration-500",
                      canVote ? "bg-primary shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse" : 
                      hasVoted ? "bg-green-500 opacity-40" : "bg-muted"
                    )} />
                    
                    <div className="flex-1 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10 bg-gradient-to-br from-background to-muted/20">
                      <div className="space-y-6 flex-1">
                        <div className="space-y-2">
                           <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant={
                                e.status === 'active' ? 'success' : 
                                e.status === 'results_published' ? 'info' : 'secondary'
                              } className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                {e.status.replace('_', ' ')}
                              </Badge>
                              {hasVoted && (
                                <Badge variant="outline" className="border-green-500/20 text-green-600 bg-green-500/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                  ✓ BALLOT DEPOSITED
                                </Badge>
                              )}
                           </div>
                           <h2 className="text-3xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">
                              {e.title}
                           </h2>
                        </div>
                        
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-2xl italic tracking-tight opacity-70">
                          {e.description ?? 'No institutional briefing provided for this election.'}
                        </p>

                        <div className="flex items-center gap-8 pt-4 border-t border-border/40">
                           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                              <Clock className="w-3.5 h-3.5 opacity-40" />
                              <span className="pt-0.5">EST: {e.voting_start ? formatDateTime(e.voting_start) : 'TBD'}</span>
                           </div>
                           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                              <ShieldCheck className="w-3.5 h-3.5 opacity-40" />
                              <span className="pt-0.5">ENCRYPTION: AES-256</span>
                           </div>
                        </div>
                      </div>

                      <div className="shrink-0 w-full md:w-auto">
                        {canVote ? (
                          <Link href={`/voter/elections/${e.id}`} className="block">
                            <Button className="w-full md:w-56 h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/10 group-hover:scale-105 transition-all text-xs md:text-sm">
                              ACCESS BALLOT
                            </Button>
                          </Link>
                        ) : e.status === 'results_published' || e.results_visible ? (
                          <Link href={`/voter/results`} className="block">
                            <Button variant="outline" className="w-full md:w-56 h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase tracking-widest bg-background border-border/40 shadow-lg shadow-black/5 hover:bg-muted/50 transition-all text-xs md:text-sm">
                              AUDIT RESULTS
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/voter/elections/${e.id}`} className="block">
                            <Button variant="ghost" className="w-full md:w-56 h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] opacity-40 group-hover:opacity-100 transition-all">
                              Inspect Candidates
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}