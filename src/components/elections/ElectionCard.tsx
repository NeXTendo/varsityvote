import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { formatDateTime, getElectionTimeStatus } from '@/lib/utils'
import type { Election } from '@/types/database.types'
import { Calendar, Users, ChevronRight } from 'lucide-react'

interface ElectionCardProps {
  election: Election
  href: string
  voted?: boolean
}

export function ElectionCard({ election, href, voted }: ElectionCardProps) {
  const timeStatus = getElectionTimeStatus(election.voting_start, election.voting_end)
  
  return (
    <Link 
      href={href}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <StatusBadge status={election.status} />
        {voted && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
            </svg>
            Voted
          </span>
        )}
      </div>

      <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
        {election.title}
      </h3>
      
      <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
        {election.description || 'No description provided.'}
      </p>

      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {election.voting_start ? formatDateTime(election.voting_start) : 'TBD'}
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-primary/60" />
            <span>0 candidates</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
