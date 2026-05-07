'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, STATUS_LABEL, cn } from '@/lib/utils'
import { Calendar, ChevronRight, Hash } from 'lucide-react'
import type { Election } from '@/types/database.types'

interface RecentElectionsProps {
  elections: Election[]
}

export function RecentElections({ elections }: RecentElectionsProps) {
  const router = useRouter()

  return (
    <div className="divide-y divide-border/20">
      {elections.map((e, index) => (
        <div 
          key={e.id}
          onClick={() => router.push(`/admin/elections/${e.id}`)}
          className="p-6 md:p-8 flex items-center justify-between group cursor-pointer hover:bg-muted/30 transition-all duration-300"
        >
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-muted/40 items-center justify-center font-black text-xs text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
              {index + 1}
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {e.title}
              </h3>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    <Hash className="w-2.5 h-2.5" /> {e.id.slice(0, 8)}
                 </div>
                 {e.voting_start && (
                   <div className="flex items-center gap-1 text-[9px] font-black text-primary/60 uppercase tracking-widest">
                      <Calendar className="w-2.5 h-2.5" /> {new Date(e.voting_start).toLocaleDateString()}
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Badge variant={e.status === 'active' ? 'success' : 'secondary'} className="hidden sm:inline-flex px-3 py-1 text-[9px] font-black uppercase tracking-widest">
              {e.status.replace('_', ' ')}
            </Badge>
            <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
      {elections.length === 0 && (
        <div className="p-20 text-center opacity-30">
          <p className="text-sm font-black uppercase tracking-widest">Zero Mandates Found</p>
        </div>
      )}
    </div>
  )
}
