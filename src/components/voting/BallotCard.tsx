import { CandidateCard } from '../candidates/CandidateCard'
import type { Candidate, Profile } from '@/types/database.types'

interface BallotCardProps {
  position: string
  candidates: (Candidate & { profiles: Profile })[]
  selectedId?: string
  onSelect: (candidateId: string) => void
}

export function BallotCard({ position, candidates, selectedId, onSelect }: BallotCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{position}</h2>
        <span className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded tracking-widest">
          Select One
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            selected={selectedId === c.id}
            onSelect={() => onSelect(c.id)}
          />
        ))}
      </div>
    </div>
  )
}
