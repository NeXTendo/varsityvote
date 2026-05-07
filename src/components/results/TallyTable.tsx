'use client'

import { CheckCircle2 } from 'lucide-react'

interface TallyItem {
  candidate_id: string
  full_name: string
  position_title?: string // from new RPC
  position?: string       // legacy fallback
  vote_count: number
}

export function TallyTable({ results }: { results: TallyItem[] }) {
  if (results.length === 0) return null

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Desktop Header - hidden on mobile */}
      <div className="hidden md:grid grid-cols-3 px-10 py-4 bg-muted/30 border border-border/40 rounded-t-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        <div>Verified Candidate</div>
        <div>Institutional Designation</div>
        <div className="text-right">Cryptographic Tally</div>
      </div>

      <div className="divide-y md:divide-none md:space-y-3">
        {results.map((r) => (
          <div 
            key={r.candidate_id} 
            className="group bg-background md:bg-background md:border md:border-border/20 md:rounded-2xl p-6 md:p-0 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-primary/[0.02] md:hover:border-primary/20 shadow-sm md:shadow-none"
          >
            <div className="md:pl-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 md:space-y-0">
                <p className="font-black tracking-tighter text-foreground group-hover:text-primary transition-colors text-xl md:text-lg">
                  {r.full_name}
                </p>
                <p className="md:hidden text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 italic">
                  {r.position_title ?? r.position}
                </p>
              </div>
            </div>

            <div className="hidden md:block">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 italic">
                {r.position_title ?? r.position}
              </span>
            </div>

            <div className="md:pr-10 text-right flex items-center justify-between md:block">
               <span className="md:hidden text-[10px] font-black uppercase tracking-widest opacity-40">Final Tally:</span>
               <div className="inline-flex flex-col items-end">
                  <span className="font-black tracking-tighter text-3xl md:text-2xl text-foreground">
                    {r.vote_count.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                    Votes verified
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
