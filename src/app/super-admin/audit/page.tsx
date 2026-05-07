import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getAuditLogs } from '@/lib/audit'
import { Topbar } from '@/components/layout/Topbar'
import { SystemAuditTable } from '@/components/admin/SystemAuditTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  ShieldCheck,
  Building2,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'System Audit | Super Admin' }

interface PageProps {
  searchParams: {
    userId?: string
    institutionId?: string
    action?: string
    q?: string
  }
}

export default async function SystemAuditPage({ searchParams }: PageProps) {
  await requireRole(['super_admin'])
  const supabase = await createClient()

  const [logs, institutionsRes] = await Promise.all([
    getAuditLogs({
      userId: searchParams.userId,
      institutionId: searchParams.institutionId,
      limit: 100
    }),
    supabase.from('institutions').select('id, name').order('name') as any
  ])

  const institutions = institutionsRes.data ?? []

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Global Audit Trail" 
        description="Immutable record of all administrative and system-level operations."
        actions={
          <div className="flex gap-3">
             <Button variant="outline" disabled className="rounded-xl font-black px-6 border-border/40 bg-background opacity-40">
                <Download className="w-4 h-4 mr-2" /> EXPORT CSV
             </Button>
             <Button variant="destructive" disabled className="rounded-xl font-black px-6 opacity-20">
                <Trash2 className="w-4 h-4 mr-2" /> PURGE LOGS
             </Button>
          </div>
        }
      />

      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="border-border/40 shadow-xl shadow-black/5 bg-background">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <History className="w-6 h-6 text-primary" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Tracked Events</p>
                    <p className="text-2xl font-black tracking-tight">{logs.length}+</p>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-border/40 shadow-xl shadow-black/5 bg-background">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-amber-500" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Filtered Coverage</p>
                    <p className="text-2xl font-black tracking-tight">System-Wide</p>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-border/40 shadow-xl shadow-black/5 bg-background">
              <CardContent className="p-6 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-500" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Registered Institutions</p>
                    <p className="text-2xl font-black tracking-tight">{institutions.length}</p>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/40 shadow-2xl shadow-black/5 bg-background overflow-hidden">
           <CardContent className="p-6">
             <form className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Search Keywords</Label>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input 
                        name="q"
                        defaultValue={searchParams.q}
                        placeholder="Action, Metadata..." 
                        className="pl-9 rounded-xl border-border/40 bg-muted/20 text-xs"
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Institution Affiliate</Label>
                   <select 
                     name="institutionId"
                     title="Filter by Institution"
                     defaultValue={searchParams.institutionId || ''}
                     className="w-full h-9 px-4 rounded-xl border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
                   >
                      <option value="">ALL INSTITUTIONS</option>
                      {institutions.map((i: any) => (
                         <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                   </select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Operation Type</Label>
                   <select 
                     name="action"
                     title="Filter by Operation Type"
                     defaultValue={searchParams.action || ''}
                     className="w-full h-9 px-4 rounded-xl border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
                   >
                      <option value="">ALL ACTIONS</option>
                      <option value="create_user">CREATE USER</option>
                      <option value="update_user">UPDATE USER</option>
                      <option value="login">LOGIN EVENT</option>
                      <option value="vote_cast">VOTE CAST</option>
                      <option value="create_election">ELECTION REGISTRY</option>
                   </select>
                </div>
                <div className="flex items-end gap-3">
                   <Button type="submit" className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-9 h-shadow-lg shadow-primary/10">
                      <Filter className="w-3.5 h-3.5 mr-2" /> REFRESH TRAIL
                   </Button>
                   <Link href="/super-admin/audit" className="flex-none">
                      <Button type="button" variant="ghost" className="rounded-xl font-black uppercase tracking-widest text-[10px] h-9">
                         RESET
                      </Button>
                   </Link>
                </div>
             </form>
           </CardContent>
        </Card>

        {/* Audit List */}
        <SystemAuditTable logs={logs} />
        
        <div className="p-12 text-center opacity-30">
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">End of Audit Stream — 50 Most Recent Entries Displayed</p>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
   return <label className={cn("block text-sm font-medium", className)}>{children}</label>
}
