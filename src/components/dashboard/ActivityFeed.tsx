import { formatDateTime } from '@/lib/utils'
import { ScrollText, UserPlus, CheckCircle2, Trophy, AlertCircle, Vote, Settings, Key, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  action: string
  created_at: string
  metadata?: any
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const getIcon = (action: string) => {
    const className = "w-4 h-4"
    switch (action) {
      case 'election_created': return <ScrollText className={className} />
      case 'election_updated': return <Settings className={className} />
      case 'candidate_registered': return <UserPlus className={className} />
      case 'candidate_approved': return <CheckCircle2 className={cn(className, "text-green-500")} />
      case 'vote_cast': return <Vote className={cn(className, "text-primary")} />
      case 'vote_token_issued': return <Key className={cn(className, "text-yellow-500")} />
      case 'results_published': return <Trophy className={cn(className, "text-primary")} />
      default: return <Zap className={className} />
    }
  }

  const getLabel = (action: string) => {
    return action.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/20 border-2 border-dashed border-border/40 rounded-[2rem] gap-4">
        <ScrollText className="w-12 h-12 text-muted-foreground/20 italic" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Zero traces found in current log.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/20 before:via-primary/5 before:to-transparent">
      {activities.map((item, index) => (
        <div 
          key={item.id} 
          className={cn("relative flex gap-8 animate-in fade-in slide-in-from-left-4 duration-700", `activity-item-${index}`)}
        >
          <style>{`
            .activity-item-${index} {
              animation-delay: ${index * 50}ms;
            }
          `}</style>
          <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background border border-border/40 shadow-xl shadow-black/5 group-hover:scale-110 transition-all duration-500">
            <div className="w-full h-full rounded-2xl bg-muted/30 flex items-center justify-center">
               {getIcon(item.action)}
            </div>
          </div>
          <div className="flex flex-col pt-1.5 flex-1">
            <div className="flex items-center justify-between">
               <p className="text-[11px] font-black tracking-[0.1em] text-foreground uppercase opacity-80">{getLabel(item.action)}</p>
               <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{formatDateTime(item.created_at)}</p>
            </div>
            {item.metadata?.details && (
              <div className="mt-3 text-[10px] font-bold leading-relaxed rounded-2xl bg-muted/40 px-5 py-4 text-muted-foreground/70 italic border border-border/40 shadow-inner">
                {item.metadata.details}
              </div>
            )}
            <div className="mt-4 border-b border-border/20 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
