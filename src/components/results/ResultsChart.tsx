import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ShieldCheck, Trophy, Users, BarChart3 } from 'lucide-react'

interface TallyItem {
  candidate_id: string
  full_name: string
  position_title?: string // from new RPC
  position?: string       // legacy fallback
  vote_count: number
}

export function ResultsChart({ results }: { results: TallyItem[] }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/20 border-2 border-dashed border-border/40 rounded-[2rem] gap-4">
        <BarChart3 className="w-12 h-12 text-muted-foreground/20 italic" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Waiting for official tally data...</p>
      </div>
    )
  }

  const maxVotes = Math.max(...results.map(r => r.vote_count), 1)

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {results.map((r, idx) => {
        const percentage = Math.round((r.vote_count / maxVotes) * 100)
        const isFirst = idx === 0
        return (
          <div key={r.candidate_id} className="space-y-4 group">
            <div className="flex items-end justify-between px-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isFirst && <Trophy className="w-4 h-4 text-primary animate-bounce duration-3000" />}
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Candidate Signature {idx + 1}</p>
                </div>
                <h4 className="text-xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors duration-500">{r.full_name}</h4>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black tracking-tighter text-primary leading-none">{r.vote_count}</p>
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Certified Votes</p>
              </div>
            </div>
            <div className="relative h-6 w-full bg-muted/30 rounded-full overflow-hidden shadow-inner border border-border/10">
               <div className={cn("absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full", `progress-bar-${idx}`)} />
               <style>{`
                 .progress-bar-${idx} {
                   width: ${percentage}%;
                   background-color: hsl(var(--primary) / ${0.1 + (percentage / 100) * 0.4});
                 }
               `}</style>
               <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[9px] font-black text-foreground/40 uppercase tracking-widest">
                  {percentage}% Lead
               </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
