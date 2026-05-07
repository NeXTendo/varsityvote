import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { CandidateCard } from '@/components/candidates/CandidateCard'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import type { Election, Candidate, Profile } from '@/types/database.types'

interface Props {
  params: { id: string }
}

export default async function AdminElectionCandidatesPage({ params }: Props) {
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
    .select('*, profiles!candidates_profile_id_fkey(*)')
    .eq('election_id', params.id)
    .order('position') as any as { data: (Candidate & { profiles: Profile })[] | null }

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      <Topbar 
        title="Candidate Roster"
        description={`Moderating credentials for: ${election.title}`} 
      />

      <div className="p-8 space-y-12 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {!candidates || candidates.length === 0 ? (
          <Card className="border-2 border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-40 text-center opacity-40">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground">
                <Users className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] mb-2 text-foreground">Roster Empty</h3>
              <p className="text-sm font-medium max-w-sm text-muted-foreground">
                No institutional applicants have registered for this mandate yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {candidates.map((c) => (
              <CandidateCard 
                key={c.id} 
                candidate={c} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
