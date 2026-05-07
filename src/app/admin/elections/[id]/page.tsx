import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatDateTime, cn } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Election, Candidate, Profile } from '@/types/database.types'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await (supabase.from('elections').select('title').eq('id', params.id).single() as any)
  return { title: data?.title ?? 'Election' }
}

export default async function ElectionDetailPage({ params }: Props) {
  const { profile } = await requireRole(['super_admin', 'election_admin'])
  const supabase = await createClient()

  const { data: election } = await supabase
    .from('elections')
    .select('*')
    .eq('id', params.id)
    .eq('institution_id', profile.institution_id!)
    .single() as any as { data: Election | null }

  if (!election) notFound()

  const { data: candidates } = await supabase
    .from('candidates')
    .select('*, profiles!candidates_profile_id_fkey(full_name, email), election_positions!inner(title)')
    .eq('election_id', params.id)
    .order('created_at', { ascending: false }) as any as { data: (Candidate & { profiles: Profile, election_positions: any })[] | null }

  const { data: positions } = await supabase
    .from('election_positions')
    .select('*')
    .eq('election_id', params.id) as any as { data: any[] | null }

  const pendingCount  = candidates?.filter(c => c.status === 'pending').length ?? 0
  const approvedCount = candidates?.filter(c => c.status === 'approved').length ?? 0

  const CANDIDATE_STATUS_PILL: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    approved:  'bg-green-100 text-green-800',
    rejected:  'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20 font-sans">
      <Topbar
        title="Election Control"
        description={`Managing: ${election.title}`}
        actions={
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
            <Link href={`/admin/elections/${params.id}/edit`} className="md:hidden">
               <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl border border-border/40">
                  <Settings className="w-4 h-4" />
               </Button>
            </Link>
            <Link href={`/admin/elections/${params.id}/results`} className="hidden sm:block">
              <Button variant="outline" className="rounded-xl font-bold px-4 md:px-6 shadow-sm bg-background h-10 md:h-12 text-[10px] md:text-sm">
                REPORTS
              </Button>
            </Link>
            <Link href={`/admin/elections/${params.id}/edit`} className="hidden md:block">
              <Button variant="outline" className="rounded-xl font-bold px-6 shadow-sm bg-background border-border/40 hover:bg-muted/50 h-12 text-sm">
                EDIT DETAILS
              </Button>
            </Link>
            <Link href={`/admin/elections/${params.id}/candidates`}>
              <Button className="rounded-xl font-black px-4 md:px-6 shadow-xl shadow-primary/20 h-10 md:h-12 text-[10px] md:text-sm">
                ROSTER
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Status + Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 md:p-6 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Current Status</p>
              <div className="pt-2">
                <Badge variant={election.status === 'active' ? 'success' : 'secondary'} className="px-2 md:px-3 py-1 text-[10px] md:text-[11px]">
                  {election.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 md:p-6 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Activation</p>
              <p className="text-xs md:text-sm font-black tracking-tight pt-2 truncate">
                {election.voting_start ? formatDateTime(election.voting_start) : 'Deploy Pending'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 md:p-6 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Termination</p>
              <p className="text-xs md:text-sm font-black tracking-tight pt-2 truncate">
                {election.voting_end ? formatDateTime(election.voting_end) : 'Manual Close'}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            "hover:border-primary/30 transition-colors border-2",
            election.results_visible ? "border-primary/20 bg-primary/5" : "border-transparent"
          )}>
            <CardContent className="p-4 md:p-6 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Public Results</p>
              <div className="pt-2 flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", election.results_visible ? "bg-green-500" : "bg-muted")} />
                <span className="text-xs md:text-sm font-black tracking-tight uppercase truncate">
                  {election.results_visible ? 'LIVE' : 'ENCRYPTED'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 space-y-8">
            {/* Candidates Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Registered Candidates</CardTitle>
                  <CardDescription>Verified institutional applicants for this mandate</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                     <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-wider">Approved</p>
                     <p className="text-lg font-black tracking-tighter text-primary">{approvedCount}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-wider">Pending</p>
                     <p className={cn("text-lg font-black tracking-tighter", pendingCount > 0 ? "text-orange-500" : "text-muted-foreground")}>{pendingCount}</p>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="divide-y divide-border/20">
                  {!candidates?.length ? (
                    <div className="h-48 flex items-center justify-center text-sm font-bold opacity-40 uppercase tracking-widest">
                      Roster Empty
                    </div>
                  ) : (
                    candidates.map(c => (
                      <div key={c.id} className="p-6 flex items-center justify-between group hover:bg-muted/30 transition-all">
                        <div className="flex items-center gap-4 min-w-0">
                           <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center font-black text-[10px] text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                              {c.election_positions.title.slice(0, 2).toUpperCase()}
                           </div>
                           <div className="space-y-1 min-w-0">
                              <p className="font-black text-foreground group-hover:text-primary transition-colors tracking-tight truncate">{(c.profiles as any)?.full_name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="px-2 py-0 text-[8px] font-black uppercase tracking-widest opacity-60">
                                   {c.election_positions.title}
                                </Badge>
                                <p className="hidden sm:block text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-60">{(c.profiles as any)?.email}</p>
                              </div>
                           </div>
                        </div>
                        <div className="shrink-0">
                          <Badge variant={c.status === 'approved' ? 'success' : c.status === 'pending' ? 'warning' : 'destructive'} className="px-3 text-[9px] font-black tracking-widest">
                            {c.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Config & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Temporal Configuration</CardTitle>
                  <CardDescription>Define the window of democratic activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={async (formData: FormData) => {
                    'use server'
                    const start = formData.get('voting_start') as string
                    const end = formData.get('voting_end') as string
                    const { updateElectionWindow } = await import('@/lib/elections')
                    await updateElectionWindow(params.id, start || null, end || null)
                  }} className="space-y-5">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Commencement</label>
                        <Input 
                          name="voting_start"
                          type="datetime-local" 
                          defaultValue={election.voting_start ? new Date(election.voting_start).toISOString().slice(0, 16) : ''}
                          className="rounded-xl h-11 bg-muted/20 border-none shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Termination</label>
                        <Input 
                          name="voting_end"
                          type="datetime-local" 
                          defaultValue={election.voting_end ? new Date(election.voting_end).toISOString().slice(0, 16) : ''}
                          className="rounded-xl h-11 bg-muted/20 border-none shadow-inner"
                        />
                      </div>
                    </div>
                    <Button type="submit" variant="secondary" className="w-full rounded-xl font-black py-4 h-11 shadow-sm border border-border text-[10px]">
                      SAVE TEMPORAL PARAMETERS
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className={cn(
                "border-2 transition-all duration-500",
                election.results_visible ? "border-primary shadow-2xl shadow-primary/10" : "border-border/40"
              )}>
                <CardHeader>
                  <CardTitle>Public Certification</CardTitle>
                  <CardDescription>Authorize institutional dissemination of final results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 text-[11px] font-bold leading-relaxed italic text-muted-foreground">
                    {election.results_visible 
                      ? "Results are currently active on the public backbone. Any voter with credentials can audit the certified tally." 
                      : "Results are currently encrypted and held in terminal custody. Public disclosure requires primary authorization."}
                  </div>
                  <form action={async () => {
                    'use server'
                    const { toggleResultsVisibility } = await import('@/lib/elections')
                    await toggleResultsVisibility(params.id, !election.results_visible)
                  }}>
                    <Button 
                      type="submit"
                      className={cn(
                        "w-full rounded-xl font-black py-4 h-11 shadow-lg transition-all duration-500 text-[10px]",
                        election.results_visible 
                          ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10' 
                          : 'bg-primary hover:primary/90 shadow-primary/10'
                      )}
                    >
                      {election.results_visible ? 'UNPUBLISH RESULTS' : 'PUBLISH CERTIFIED TALLY'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-8">
             <Card>
               <CardHeader>
                 <CardTitle>System Metadata</CardTitle>
                 <CardDescription>Underlying record properties</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">System UUID</span>
                    <span className="text-[10px] font-bold font-mono bg-muted px-2 py-0.5 rounded uppercase">{election.id.slice(0, 16)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">Creation Date</span>
                    <span className="text-[10px] font-bold uppercase">{formatDateTime(election.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">Last Sync</span>
                    <span className="text-[10px] font-bold uppercase">{formatDateTime(new Date().toISOString())}</span>
                  </div>
               </CardContent>
             </Card>

             <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
               <h4 className="text-primary font-black uppercase tracking-widest text-[11px] mb-3">VARSITYVOTE CORE</h4>
               <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground">
                 This interface is cryptographically linked to your institutional role. All operations are logged in the immutable audit trail for governance verification.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}