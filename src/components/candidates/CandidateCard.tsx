import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ExternalLink, FileText, CheckCircle2 } from 'lucide-react'
import type { Candidate, Profile } from '@/types/database.types'

interface CandidateCardProps {
  candidate: Candidate & { profiles: Profile }
  onSelect?: () => void
  selected?: boolean
}

export function CandidateCard({ candidate, onSelect, selected }: CandidateCardProps) {
  const p = candidate.profiles
  
  return (
    <Card 
      className={cn(
        "relative group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-border/40",
        selected && "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xl shadow-primary/5"
      )}
    >
      <CardContent className="p-8 space-y-6">
        <div className="flex items-start justify-between">
          <Avatar className="w-16 h-16 rounded-2xl border-2 border-border/40 group-hover:border-primary/40 transition-all duration-500 shadow-inner">
            <AvatarImage src={candidate.photo_url || ""} alt={p.full_name} className="object-cover" />
            <AvatarFallback className="text-lg font-black bg-muted/60 text-muted-foreground/40 uppercase">
              {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {onSelect && (
            <button
              onClick={onSelect}
              className={cn(
                "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                selected 
                  ? "bg-primary border-primary shadow-lg shadow-primary/30" 
                  : "bg-background border-border hover:border-primary/40"
              )}
            >
              {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <h4 className="text-lg font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-300">
            {p.full_name}
          </h4>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-60">
            {candidate.position}
          </Badge>
        </div>
        
        {candidate.bio && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Election Bio</p>
            <p className="text-[11px] font-medium leading-relaxed text-muted-foreground line-clamp-3 italic opacity-80">
              "{candidate.bio}"
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-8 py-5 bg-muted/30 border-t border-border/40 flex items-center justify-between">
        <Badge 
          variant={candidate.status === 'approved' ? 'success' : candidate.status === 'pending' ? 'warning' : 'destructive'}
          className="px-3 text-[10px] uppercase font-black tracking-widest"
        >
          {candidate.status}
        </Badge>
        
        {candidate.manifesto_url ? (
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest" asChild>
            <a href={candidate.manifesto_url} target="_blank" rel="noopener noreferrer">
              Manifesto <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
            <FileText className="w-3 h-3" /> NO FILE
          </div>
        )}
      </CardFooter>

      {/* Decorative side bar */}
      <div className={cn(
        "absolute top-0 left-0 h-full w-1 transition-all duration-700",
        candidate.status === 'approved' ? "bg-green-500" : candidate.status === 'pending' ? "bg-orange-500" : "bg-red-500"
      )} />
    </Card>
  )
}
