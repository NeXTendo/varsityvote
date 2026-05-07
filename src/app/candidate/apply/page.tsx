import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatDateTime } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Trophy, Users, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Apply for Position' }

export default async function CandidateApplyPage() {
  const { profile } = await requireRole(['candidate', 'election_admin', 'super_admin'])
  const supabase = await createClient()

  // Fetch elections open for candidate registration
  const { data: elections } = await supabase
    .from('elections')
    .select('*')
    .eq('institution_id', profile.institution_id!)
    .in('status', ['draft', 'active'])
    .order('created_at', { ascending: false }) as any

  // For each election, get its positions
  const electionIds = (elections ?? []).map((e: any) => e.id)
  const { data: positions } = electionIds.length > 0
    ? await supabase
        .from('election_positions')
        .select('*')
        .in('election_id', electionIds)
    : { data: [] }

  // Get this candidate's existing applications
  const { data: myApplications } = await supabase
    .from('candidates')
    .select('election_position_id, status')
    .eq('profile_id', profile.id) as any

  const appliedPositionIds = new Set((myApplications ?? []).map((a: any) => a.election_position_id))

  // Group positions by election_id
  const positionsByElection: Record<string, any[]> = {}
  for (const pos of (positions ?? []) as any[]) {
    if (!positionsByElection[pos.election_id]) positionsByElection[pos.election_id] = []
    positionsByElection[pos.election_id].push(pos)
  }

  // Show all draft/active elections — only filter out ones whose registration deadline has passed
  const openElections = (elections ?? []).filter((e: any) => {
    if (!e.registration_deadline) return true  // no deadline = always open
    return new Date() < new Date(e.registration_deadline)
  })

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="Apply for Position"
        description="Browse open mandates and submit your institutional candidacy."
      />

      <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {openElections.length === 0 ? (
          <Card className="border-2 border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-32 text-center opacity-40 space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center">
                <ClipboardList className="w-10 h-10 stroke-[1]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-[0.2em]">No Open Applications</h3>
                <p className="text-sm font-medium max-w-sm italic">
                  There are currently no elections accepting candidate applications. Check back once registration opens.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          openElections.map((election: any) => {
            const elPositions: any[] = positionsByElection[election.id] ?? []
            return (
              <div key={election.id} className="space-y-6">
                {/* Election Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant={election.status === 'active' ? 'success' : 'secondary'}
                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1"
                      >
                        {election.status === 'active' ? 'Registration Open' : 'Upcoming'}
                      </Badge>
                      {election.category && (
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 border border-border/40 px-2 py-0.5 rounded-md">
                          {election.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase">
                      {election.title}
                    </h2>
                  </div>
                  {election.registration_deadline && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 shrink-0 bg-muted/40 px-4 py-2 rounded-xl border border-border/40">
                      <Calendar className="w-3 h-3" />
                      Deadline: {formatDateTime(election.registration_deadline)}
                    </div>
                  )}
                </div>

                {/* Positions Grid or placeholder */}
                {elPositions.length === 0 ? (
                  <div className="flex items-center gap-4 p-6 rounded-2xl border-2 border-dashed border-border/40 bg-muted/20">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 opacity-40">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest opacity-60">No Positions Configured</p>
                      <p className="text-[10px] font-medium text-muted-foreground italic mt-1">
                        The administrator has not added any positions to this election yet. Check back later.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {elPositions.map((pos: any) => {
                      const alreadyApplied = appliedPositionIds.has(pos.id)
                      const myApp = (myApplications ?? []).find((a: any) => a.election_position_id === pos.id)

                      return (
                        <Card
                          key={pos.id}
                          className={`border-border/40 shadow-xl shadow-black/5 overflow-hidden group transition-all duration-500 hover:-translate-y-1 ${alreadyApplied ? 'opacity-70' : ''}`}
                        >
                          <CardContent className="p-0">
                            <div className="p-6 md:p-8 space-y-6">
                              {/* Position Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                                      {pos.title.slice(0, 2).toUpperCase()}
                                    </div>
                                    <h3 className="font-black text-lg tracking-tight text-foreground group-hover:text-primary transition-colors uppercase">
                                      {pos.title}
                                    </h3>
                                  </div>
                                  {pos.description && (
                                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic line-clamp-2 pl-1">
                                      {pos.description}
                                    </p>
                                  )}
                                </div>
                                {alreadyApplied && (
                                  <Badge
                                    variant={myApp?.status === 'approved' ? 'success' : myApp?.status === 'rejected' ? 'destructive' : 'warning'}
                                    className="text-[9px] font-black uppercase tracking-widest px-3 py-1 shrink-0"
                                  >
                                    {myApp?.status ?? 'Applied'}
                                  </Badge>
                                )}
                              </div>

                              {/* Meta */}
                              <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                <div className="flex items-center gap-1.5">
                                  <Trophy className="w-3 h-3" />
                                  {pos.max_winners === 1 ? '1 Winner' : `${pos.max_winners} Winners`}
                                </div>
                                <div className="h-3 w-px bg-border/60" />
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3 h-3" />
                                  Max {pos.max_candidates} Candidates
                                </div>
                              </div>
                            </div>

                            {/* Action Footer */}
                            <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0">
                              {alreadyApplied ? (
                                <div className="h-12 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                  APPLICATION SUBMITTED
                                </div>
                              ) : (
                                <Link
                                  href={`/candidate/apply/${election.id}/positions/${pos.id}`}
                                  className="block"
                                >
                                  <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 group-hover:scale-[1.02] transition-transform text-sm">
                                    APPLY FOR THIS POSITION →
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
