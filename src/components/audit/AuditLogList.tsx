'use client'

import { formatDateTime, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Terminal, 
  History, 
  User, 
  CheckCircle2, 
  ShieldAlert, 
  Key, 
  Vote, 
  PlusCircle, 
  Settings, 
  Database,
  ArrowRight
} from 'lucide-react'
import type { AuditLog, Profile } from '@/types/database.types'

interface AuditLogListProps {
  logs: (AuditLog & { profiles: Profile | null })[]
}

const ACTION_LABEL: Record<string, { label: string, icon: any, color: string }> = {
  election_created:       { label: 'Mandate Generated', icon: PlusCircle, color: 'text-primary' },
  election_updated:       { label: 'Mandate Refined', icon: Settings, color: 'text-muted-foreground' },
  election_status_changed:{ label: 'Status Transition', icon: History, color: 'text-primary' },
  candidate_registered:   { label: 'Register Entry', icon: User, color: 'text-muted-foreground' },
  candidate_approved:     { label: 'Credential Verified', icon: CheckCircle2, color: 'text-green-500' },
  candidate_rejected:     { label: 'Verification Denied', icon: ShieldAlert, color: 'text-destructive' },
  vote_token_issued:      { label: 'Token Generation', icon: Key, color: 'text-yellow-600' },
  vote_cast:              { label: 'Ballot Deposited', icon: Vote, color: 'text-primary' },
  results_published:      { label: 'Ledger Published', icon: Database, color: 'text-primary' },
  user_role_changed:      { label: 'Privilege Shift', icon: Key, color: 'text-primary' },
}

export function AuditLogList({ logs }: AuditLogListProps) {
  return (
    <div className="divide-y divide-border/20">
      {logs.map((log, index) => {
        const meta = ACTION_LABEL[log.action] || { label: log.action.replace('_', ' '), icon: Terminal, color: 'text-muted-foreground' }
        const Icon = meta.icon
        return (
          <div 
            key={log.id} 
            className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-muted/30 transition-all duration-300"
          >
            <div className="flex items-start gap-3 md:gap-4 min-w-0">
              <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all")}>
                <Icon className={cn("w-4 h-4 md:w-5 md:h-5", meta.color)} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs md:text-sm uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                    {meta.label}
                  </span>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-border/40 opacity-60">
                    {log.target_type || 'SYSTEM'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5 rounded-lg border border-border/40">
                       <AvatarImage src={log.profiles?.avatar_url || ""} />
                       <AvatarFallback className="text-[8px] font-black uppercase bg-muted/60">{log.profiles?.full_name?.[0] || 'S'}</AvatarFallback>
                    </Avatar>
                    <p className="text-[10px] font-bold text-muted-foreground/80 truncate">
                      {log.profiles?.full_name || 'System Execution'}
                    </p>
                  </div>
                  <span className="text-muted-foreground/30">•</span>
                  <p className="text-[10px] font-mono font-black text-muted-foreground/40 uppercase tracking-widest">
                    {formatDateTime(log.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 pl-14 md:pl-0">
              {log.metadata && Object.keys(log.metadata as object).length > 0 && (
                <div className="text-[9px] font-bold bg-muted/50 px-4 py-2 rounded-xl border border-border/40 max-w-[200px] truncate italic text-muted-foreground/60 shadow-inner">
                  {JSON.stringify(log.metadata).replace(/["{}]/g, '').slice(0, 30)}...
                </div>
              )}
              <div className="hidden md:flex w-8 h-8 rounded-full bg-muted/30 items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
