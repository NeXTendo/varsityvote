'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Info, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, STATUS_LABEL, STATUS_COLOR, cn } from '@/lib/utils'
import type { Election } from '@/types/database.types'

interface ElectionListProps {
  elections: Election[]
}

export function ElectionList({ elections }: ElectionListProps) {
  return (
    <>
      {/* Desktop View */}
      <Card className="hidden md:block border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-[40%]">Institutional Mandate</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">Voting Window</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Visibility</TableHead>
              <TableHead className="px-8 py-5 text-right font-black uppercase tracking-widest text-muted-foreground/60"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {elections.map(e => (
              <TableRow key={e.id} className="group hover:bg-muted/30 transition-all duration-300">
                <TableCell className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="font-black text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">{e.title}</p>
                    {e.description && (
                      <p className="text-[11px] font-medium text-muted-foreground/80 max-w-md truncate italic">
                        "{e.description}"
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-8 py-6">
                   <Badge variant={e.status === 'active' ? 'success' : e.status === 'draft' ? 'secondary' : 'destructive'} className="px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      {(STATUS_LABEL as any)[e.status]}
                   </Badge>
                </TableCell>
                <TableCell className="px-8 py-6">
                  {e.voting_start && e.voting_end ? (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground font-mono">
                       <Calendar className="w-3 h-3 opacity-40" />
                       <span className="bg-muted px-2 py-0.5 rounded-md border border-border/20">{formatDateTime(e.voting_start)}</span>
                       <span className="opacity-40">→</span>
                       <span className="bg-muted px-2 py-0.5 rounded-md border border-border/20">{formatDateTime(e.voting_end)}</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-40">UNSCHEDULED</Badge>
                  )}
                </TableCell>
                <TableCell className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", e.results_visible ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-muted-foreground/30")} />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", e.results_visible ? "text-green-600" : "text-muted-foreground/60")}>
                        {e.results_visible ? 'PUBLISHED' : 'PROTECTED'}
                      </span>
                   </div>
                </TableCell>
                <TableCell className="px-8 py-6 text-right">
                  <Link href={`/admin/elections/${e.id}`}>
                    <Button variant="outline" size="sm" className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest border-border/60 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                      Control <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile View - Cards */}
      <div className="grid grid-cols-1 gap-6 md:hidden">
        {elections.map(e => (
          <Card key={e.id} className="border-border/40 shadow-xl shadow-black/5 overflow-hidden group">
            <CardContent className="p-0">
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={e.status === 'active' ? 'success' : e.status === 'draft' ? 'secondary' : 'destructive'} className="px-2 py-0 text-[8px] font-black uppercase tracking-widest">
                        {(STATUS_LABEL as any)[e.status]}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", e.results_visible ? "bg-green-500 shadow-lg" : "bg-muted-foreground/30")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-widest", e.results_visible ? "text-green-600" : "text-muted-foreground/60")}>
                          {e.results_visible ? 'PUBLISHED' : 'PROTECTED'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">{e.title}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {e.voting_start && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/10">
                      <Calendar className="w-4 h-4 text-primary opacity-40" />
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Voting Window</p>
                        <p className="text-xs font-bold text-foreground font-mono">
                          {formatDateTime(e.voting_start)} → {e.voting_end ? formatDateTime(e.voting_end) : '???'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {e.description && (
                    <div className="flex gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                      <Info className="w-4 h-4 text-primary opacity-40 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium leading-relaxed italic text-muted-foreground line-clamp-2">
                        {e.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Link href={`/admin/elections/${e.id}`}>
                <Button className="w-full rounded-none h-11 md:h-12 font-black uppercase tracking-widest gap-3 shadow-none text-[10px]">
                  MANAGE MANDATE <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
