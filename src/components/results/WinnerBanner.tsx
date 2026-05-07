import { Trophy, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WinnerBannerProps {
  name: string
  position: string
  voteCount: number
}

export function WinnerBanner({ name, position, voteCount }: WinnerBannerProps) {
  return (
    <Card className="relative overflow-hidden border-none bg-primary shadow-2xl shadow-primary/20">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
      
      <CardContent className="relative z-10 p-6 md:p-10 flex flex-col items-center text-center">
        <div className="group relative">
          <div className="absolute inset-0 bg-white/20 rounded-xl md:rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center mb-4 md:mb-6 backdrop-blur-md border border-white/30 shadow-inner">
            <Trophy className="w-7 h-7 md:w-8 md:h-8 text-white stroke-[2.5] drop-shadow-lg" />
          </div>
        </div>
        
        <div className="space-y-1 mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Official Certified Winner
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-md">
            {name}
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-widest italic">{position}</p>
        </div>
        
        <div className="inline-flex items-center gap-3 rounded-xl md:rounded-2xl bg-black/20 px-4 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-black backdrop-blur-md border border-white/10 shadow-xl transition-transform hover:scale-105 cursor-default">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-white uppercase tracking-tighter">
            {voteCount.toLocaleString()} VERIFIED VOTES
          </span>
        </div>
      </CardContent>

      <div className="absolute bottom-[-40px] right-[-40px] opacity-10 pointer-events-none">
        <Trophy className="w-64 h-64 rotate-12 text-white stroke-[1]" />
      </div>
    </Card>
  )
}
