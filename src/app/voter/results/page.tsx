import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { ResultsChart } from '@/components/results/ResultsChart'
import { TallyTable } from '@/components/results/TallyTable'
import { WinnerBanner } from '@/components/results/WinnerBanner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, ShieldCheck, CheckCircle2 } from 'lucide-react'
import type { Election } from '@/types/database.types'
import { cn } from '@/lib/utils'

export default async function VoterResultsPage() {
  const { profile } = await requireAuth()
  const supabase = await createClient()

  const { data: elections } = await supabase
    .from('elections')
    .select('*')
    .eq('institution_id', profile.institution_id!)
    .in('status', ['active', 'closed', 'results_published'])
    .eq('results_visible', true)
    .order('created_at', { ascending: false }) as any as { data: Election[] | null }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Institutional Audit" 
        description="Public certification and final verified tallies of concluded mandates." 
      />

      <div className="p-4 md:p-8 space-y-16 md:space-y-24 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {!elections || elections.length === 0 ? (
          <Card className="border-none bg-muted/30 shadow-none h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center p-10 md:p-20 text-center opacity-40 gap-6">
              <div className="relative w-20 h-20 md:w-24 md:h-24">
                <div className="absolute inset-0 bg-muted rounded-full blur-2xl animate-pulse" />
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center shadow-xl shadow-black/5">
                  <LayoutDashboard className="w-10 h-10 md:w-12 md:h-12 stroke-[1.2]" />
                </div>
              </div>
              <div className="space-y-3">
                 <h3 className="text-lg md:text-xl font-black uppercase tracking-[0.3em]">No Certified Results</h3>
                 <p className="text-[10px] md:text-sm font-medium max-w-sm mx-auto leading-relaxed italic">
                    The institutional audit process is currently active for all recent mandates. Results will be published following cryptographic verification.
                 </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          await Promise.all(elections.map(async (e) => {
             const { data: results, error: resultsError } = await (supabase as any).rpc('get_results', { p_election_id: e.id }) as any
             const isHidden = !e.results_visible
             
             const tallyByPosition = isHidden ? {} : (results || []).reduce<Record<string, any>>((acc, r) => {
                if (!acc[r.position_id]) {
                  acc[r.position_id] = {
                    title: r.position_title,
                    items: [],
                    winner: null
                  }
                }
                acc[r.position_id].items.push(r)
                // In get_results, candidates are sorted by vote_count desc, so first one is winner if counts exist
                if (!acc[r.position_id].winner && r.vote_count > 0) {
                  acc[r.position_id].winner = r
                }
                return acc
             }, {})

             const isActive = e.status === 'active'
 
             return (
               <section key={e.id} className="space-y-8 md:space-y-12 last:border-0 border-b border-border/40 pb-16 md:pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                 <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8">
                   <div className="space-y-3 w-full">
                      <div className="flex items-center gap-3 flex-wrap">
                         <Badge 
                           variant={isActive ? 'default' : 'info'} 
                           className={cn(
                             "px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                             isActive ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary/10 text-primary border-primary/20"
                           )}
                         >
                           {isActive ? 'LIVE MONITORING' : 'CERTIFIED FINAL TALLY'}
                         </Badge>
                         <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Ref: {e.id.slice(0, 12)}</span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase break-words leading-tight">{e.title}</h2>
                   </div>
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border/40 shadow-lg shadow-black/5 shrink-0">
                      <div className={cn("w-3 h-3 rounded-full shadow-lg", isActive ? "bg-green-500 animate-pulse" : "bg-primary")} />
                      <div className="space-y-0.5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">Status</p>
                         <p className="text-xs font-bold text-foreground uppercase tracking-tighter">{e.status.replace('_', ' ')}</p>
                      </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                   <div className="lg:col-span-8 space-y-16">
                      {isHidden ? (
                        <div className="relative group">
                           <div className="absolute inset-0 bg-muted/40 backdrop-blur-sm rounded-3xl z-10 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border/60">
                              <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center shadow-2xl mb-6">
                                 <ShieldCheck className="w-8 h-8 text-primary" />
                              </div>
                              <h4 className="text-xl font-black tracking-tight uppercase mb-2">Live Tally Encrypted</h4>
                              <p className="text-sm font-medium text-muted-foreground max-w-sm italic">
                                Real-time statistical dissemination for this mandate is currently restricted by institutional governance.
                              </p>
                           </div>
                           {/* Blurred Placeholder Chart */}
                           <div className="opacity-10 grayscale pointer-events-none filter blur-sm">
                             <ResultsChart results={[]} />
                           </div>
                        </div>
                      ) : (
                        Object.values(tallyByPosition).map((pos: any) => (
                          <div key={pos.title} className="space-y-12 pb-12 border-b border-border/10 last:border-0">
                            <div className="flex items-center gap-4">
                              <div className="h-px bg-primary/20 flex-1" />
                              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap bg-background px-4 py-2 rounded-xl border border-primary/10">
                                {pos.title}
                              </h3>
                              <div className="h-px bg-primary/20 flex-1" />
                            </div>

                            <div className="space-y-10">
                              <div className="space-y-6">
                                <div className="flex items-center gap-3 ml-2">
                                  <div className="w-1 bg-primary h-4 rounded-full" />
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                    Distribution
                                  </h4>
                                </div>
                                <ResultsChart results={pos.items} />
                              </div>

                              <div className="space-y-6">
                                <div className="flex items-center gap-3 ml-2">
                                  <div className="w-1 bg-primary h-4 rounded-full" />
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                                    Tally Audit
                                  </h4>
                                </div>
                                <TallyTable results={pos.items} />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                   </div>
                   
                   <div className="lg:col-span-4 space-y-8 sticky top-24">
                       {isActive ? (
                         <Card className="border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
                           <CardContent className="p-10 text-center space-y-6">
                              <div className="w-20 h-20 rounded-[2.5rem] bg-primary flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
                                 <LayoutDashboard className="w-10 h-10 text-white animate-pulse" />
                              </div>
                              <div className="space-y-2">
                                 <h3 className="text-xl font-black tracking-tight uppercase">Election Active</h3>
                                 <p className="text-xs font-black text-primary uppercase tracking-widest opacity-60">Tallying live ballots</p>
                              </div>
                              <div className="p-4 rounded-2xl bg-background border border-primary/10 text-[11px] font-medium leading-relaxed italic text-muted-foreground">
                                Results for active mandates are refreshed every 60 seconds.
                              </div>
                           </CardContent>
                         </Card>
                       ) : Object.keys(tallyByPosition).length > 0 ? (
                         <div className="space-y-6">
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2">Certified Mandate Holders</p>
                           {Object.values(tallyByPosition).map((pos: any) => pos.winner && (
                             <WinnerBanner 
                               key={pos.title}
                               name={pos.winner.full_name} 
                               position={pos.title} 
                               voteCount={pos.winner.vote_count} 
                             />
                           ))}
                         </div>
                       ) : (
                         <WinnerBanner 
                           name="Verification Pending" 
                           position="Official Mandate Holder" 
                           voteCount={0} 
                         />
                       )}
                      
                      <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
                         <CardHeader className="bg-muted/30 border-b border-border/40 p-8">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Audit Certificate</CardTitle>
                         </CardHeader>
                         <CardContent className="p-8 space-y-6">
                            <p className="text-sm font-medium leading-relaxed italic text-muted-foreground">
                              This document serves as the official institutional certification of the electoral process for the titular mandate. 
                            </p>
                            <div className="space-y-4">
                               {[
                                 'Identity Verification',
                                 'Duplicate Ballot Scrubbing',
                                 'Cryptographic Signature Check',
                                 'Observer Protocol Compliance'
                               ].map(step => (
                                 <div key={step} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="text-[11px] font-bold uppercase tracking-tight text-foreground/80">{step}</span>
                                 </div>
                               ))}
                            </div>
                         </CardContent>
                      </Card>
                   </div>
                 </div>
               </section>
             )
          }))
        )}
      </div>
    </div>
  )
}
