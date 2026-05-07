import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { ResultsChart } from '@/components/results/ResultsChart'
import { TallyTable } from '@/components/results/TallyTable'
import { WinnerBanner } from '@/components/results/WinnerBanner'
import { notFound } from 'next/navigation'
import type { Election } from '@/types/database.types'

interface Props {
  params: { id: string }
}

export default async function AdminElectionResultsPage({ params }: Props) {
  const { profile } = await requireRole(['super_admin', 'election_admin'])
  const supabase = await createClient()

  const { data: election } = await supabase
    .from('elections')
    .select('*')
    .eq('id', params.id)
    .eq('institution_id', profile.institution_id!)
    .single() as any as { data: Election | null }

  if (!election) notFound()

  // In a real implementation, we'd fetch actual results here
  // For the sprint demonstration, we layout the components
  const mockResults = [
    { candidate_id: '1', full_name: 'John Doe', position: 'President', vote_count: 450 },
    { candidate_id: '2', full_name: 'Jane Smith', position: 'President', vote_count: 320 },
    { candidate_id: '3', full_name: 'Bob Wilson', position: 'Secretary', vote_count: 512 }
  ]

  const topWinner = mockResults.sort((a,b) => b.vote_count - a.vote_count)[0]

  return (
    <div>
      <Topbar 
        title={`Results: ${election.title}`}
        description="Internal live tally and visualization (admin only)." 
      />

      <div className="p-6 max-w-6xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h3 className="font-bold text-lg mb-6 tracking-tight">Vote Distribution</h3>
              <ResultsChart results={mockResults as any} />
            </div>
            
            <TallyTable results={mockResults as any} />
          </div>

          <div className="space-y-6">
            <WinnerBanner 
              name={topWinner.full_name} 
              position={topWinner.position} 
              voteCount={topWinner.vote_count} 
            />

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h4 className="font-bold text-sm">Election Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Turnout</span>
                  <span className="font-bold">78%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-green-500 w-[78%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
