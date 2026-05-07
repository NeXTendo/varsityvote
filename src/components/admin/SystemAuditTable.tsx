'use client'

import { formatDateTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Building2, 
  Clock, 
  Settings2, 
  ShieldAlert,
  Archive,
  UserPlus,
  Edit3,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ACTION_ICONS: Record<string, any> = {
  create_user: UserPlus,
  update_user: Edit3,
  delete_user: Trash2,
  login: Lock,
  logout: Unlock,
  create_institution: Building2,
  update_institution: Settings2,
}

const ACTION_COLORS: Record<string, string> = {
  create_user: 'bg-emerald-500/10 text-emerald-500',
  update_user: 'bg-primary/10 text-primary',
  delete_user: 'bg-red-500/10 text-red-500',
  login: 'bg-blue-500/10 text-blue-500',
  create_institution: 'bg-amber-500/10 text-amber-500',
}

export function SystemAuditTable({ logs }: { logs: any[] }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border/40">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Action</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identity</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Context / Details</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Affiliation</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Timestamp</th>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/40">
          {logs.length > 0 ? (
            logs.map((log) => {
              const Icon = ACTION_ICONS[log.action] || Archive
              return (
                <TableRow key={log.id} className="group hover:bg-muted/30 transition-all border-border/40">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground')}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold tracking-tight text-foreground">{log.profiles?.full_name || 'System'}</p>
                      <p className="text-[10px] font-medium text-muted-foreground opacity-60 uppercase tracking-widest">{log.profiles?.email || 'automated_process'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <code className="text-[10px] bg-muted px-2 py-1 rounded-md text-muted-foreground font-mono block max-w-[200px] truncate">
                      {JSON.stringify(log.metadata)}
                    </code>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-60">
                      <Building2 className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{log.institutions?.name || 'GLOBAL'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold tabular-nums">{formatDateTime(log.created_at)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-64 text-center">
                <div className="flex flex-col items-center gap-4 opacity-20">
                  <ShieldAlert className="w-12 h-12" />
                  <p className="text-sm font-black uppercase tracking-widest">No matching audit logs found</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
