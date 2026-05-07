'use client'

import { useRouter } from 'next/navigation'
import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

interface ElectionRowProps {
  election: any
  index: number
}

export function ElectionRow({ election, index }: ElectionRowProps) {
  const router = useRouter()

  return (
    <TableRow 
      className="group cursor-pointer hover:bg-muted/30 transition-all duration-500 border-b border-border/20 last:border-0 h-24" 
      onClick={() => router.push(`/admin/elections/${election.id}`)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <TableCell className="pl-10">
        <div className="flex items-center gap-5 min-w-[200px]">
           <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center font-black text-xs text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500">
              {index + 1}
           </div>
           <div className="space-y-1">
              <p className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tighter leading-none">{election.title}</p>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">HASH: {election.id.slice(0, 16)}</p>
           </div>
        </div>
      </TableCell>
      <TableCell className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-60 whitespace-nowrap">
        {election.voting_start ? formatDateTime(election.voting_start) : 'PENDING SCHEDULE'}
      </TableCell>
      <TableCell className="text-right pr-10">
        <Badge variant={
          election.status === 'active' ? 'success' : 
          election.status === 'results_published' ? 'info' : 'secondary'
        } className="px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
          {election.status.replace('_', ' ')}
        </Badge>
      </TableCell>
    </TableRow>
  )
}
