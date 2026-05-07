import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatDateTime, getElectionTimeStatus } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ShieldCheck, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Election, Candidate, Profile, VoteToken } from '@/types/database.types'

interface Props { params: { id: string } }

type CandidateWithProfile = Candidate & { profiles: Profile }

export const metadata: Metadata = { title: 'Election' }

export default async function VoterElectionDetailPage({ params }: Props) {
  const { profile } = await requireAuth()
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
    .select('*, profiles!candidates_profile_id_fkey(full_name, avatar_url, student_id), election_positions!inner(title, id)')
    .eq('election_id', params.id)
    .eq('status', 'approved') as any as { data: (CandidateWithProfile & { election_positions: any })[] | null }

  const { data: positions } = await supabase
    .from('election_positions')
    .select('*')
    .eq('election_id', params.id) as any as { data: any[] | null }

  // Check if voter already voted
  const { data: token } = await supabase
    .from('vote_tokens')
    .select('used')
    .eq('election_id', params.id)
    .eq('voter_id', profile.id)
    .single() as any as { data: VoteToken | null }

  const hasVoted   = token?.used === true
  const timeStatus = getElectionTimeStatus(election.voting_start, election.voting_end)
  const canVote    = election.status === 'active' && timeStatus === 'open' && !hasVoted

  // Group candidates by position
  const byPosition = (candidates ?? []).reduce<Record<string, any[]>>((acc, c) => {
    if (!c) return acc
    const posTitle = c.election_positions.title
    if (!acc[posTitle]) acc[posTitle] = []
    acc[posTitle]!.push(c)
    return acc
  }, {})

  const isRegistrationOpen = election.registration_deadline 
    ? new Date() < new Date(election.registration_deadline) 
    : false

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title={election.title}
        description={election.description ?? "Secure cryptographic mandate for institutional governance."}
        actions={
          <div className="flex items-center gap-4">
            {isRegistrationOpen && (
              <Link href={`/voter/elections/${params.id}/register`}>
                <Button variant="outline" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all">
                  NOMINATE YOURSELF
                </Button>
              </Link>
            )}
            {canVote ? (
              <Link href={`/voter/elections/${params.id}/vote`}>
                <Button className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest shadow-2xl shadow-primary/20 animate-pulse hover:animate-none group hover:scale-105 transition-all">
                  ACCESS SECURE BALLOT
                </Button>
              </Link>
            ) : hasVoted ? (
              <Badge variant="success" className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] bg-green-500/10 text-green-600 border-green-500/20">
                ✓ BALLOT DEPOSITED
              </Badge>
            ) : (
              <Badge variant="secondary" className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                {timeStatus.toUpperCase()}
              </Badge>
            )}
          </div>
        }
      />

      <div className="p-8 space-y-16 max-w-[1500px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Status banner */}
        {hasVoted && (
          <Card className="border-none bg-background shadow-2xl shadow-black/5 overflow-hidden group">
            <div className="h-1 bg-green-500 animate-pulse" />
            <CardContent className="p-10 flex items-center gap-10">
              <div className="w-20 h-20 rounded-[2rem] bg-green-500 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <ShieldCheck className="w-10 h-10 text-white stroke-[2.5]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Integrity Certified</h3>
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60 leading-relaxed max-w-2xl italic">
                  Your cryptographic signature has been successfully appended to the institutional ledger. This mandate is now immutable and final.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-6 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] ml-2">
           <LayoutDashboard className="w-4 h-4 opacity-40" />
           WINDOW: {election.voting_start ? formatDateTime(election.voting_start) : 'TBD'} — {election.voting_end ? formatDateTime(election.voting_end) : 'TBD'}
           <div className="h-px bg-border/40 flex-1 ml-4" />
        </div>

        {/* Candidates by position */}
        {Object.entries(byPosition).map(([position, positionCandidates]) => (
          <div key={position} className="space-y-12">
            <div className="relative inline-block">
              <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase pt-4 pb-2">
                {position}
              </h2>
              <div className="h-2 bg-primary w-1/2 rounded-full absolute bottom-0 left-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {positionCandidates?.map((c, index) => {
                const p = c.profiles as any
                return (
                  <Card key={c.id} className="group relative overflow-hidden transition-all duration-700 hover:-translate-y-2 border-border/40 shadow-xl shadow-black/2 bg-background animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="relative h-48 bg-muted overflow-hidden">
                       <Avatar className="w-full h-full rounded-none">
                          <AvatarImage src={c.photo_url || ""} alt={p?.full_name} className="object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100" />
                          <AvatarFallback className="text-4xl font-black bg-muted text-muted-foreground/20 uppercase">
                            {p?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                       </Avatar>
                       <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
                    </div>

                    <CardContent className="p-10 space-y-8 relative">
                      <div className="space-y-2">
                         <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest opacity-40 border-border/40 mb-2">ID: {p?.student_id}</Badge>
                         <h3 className="font-black text-3xl text-foreground tracking-tighter leading-none group-hover:text-primary transition-colors duration-500">{p?.full_name}</h3>
                      </div>

                      <div className="space-y-6">
                        {c.bio && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Briefing</p>
                            <p className="text-xs font-bold leading-relaxed text-muted-foreground italic line-clamp-3">"{c.bio}"</p>
                          </div>
                        )}
                        {c.manifesto && (
                          <div className="pt-8 border-t border-border/20 space-y-4">
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Institutional Mandate</p>
                            <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/80 line-clamp-4 italic">
                              {c.manifesto}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                       <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {!Object.keys(byPosition).length && (
          <Card className="border-none bg-muted/20 shadow-none h-[400px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center p-20 text-center opacity-40 space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center shadow-xl shadow-black/5">
                 <ShieldCheck className="w-10 h-10 stroke-[1.2]" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black uppercase tracking-[0.3em]">Verification in Progress</h3>
                 <p className="text-sm font-medium max-w-sm italic">
                   The candidate roster for this mandate is currently undergoing institutional cryptographic audit.
                 </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}