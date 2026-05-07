import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatDateTime, cn } from '@/lib/utils'
import { AuditLogList } from '@/components/audit/AuditLogList'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import type { AuditLog, Profile } from '@/types/database.types'

export const metadata: Metadata = { title: 'Registry Audit' }

export default async function AuditLogsPage() {
  const { profile } = await requireRole(['super_admin', 'election_admin'])
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profiles:actor_id(full_name, email, avatar_url)
    `)
    .eq('institution_id', profile.institution_id!)
    .order('created_at', { ascending: false })
    .limit(100) as any as { data: (AuditLog & { profiles: Profile | null })[] | null }

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

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Institutional Audit" 
        description="Public certification and immutable logs of system-wide administrative operations."
      />

          <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/40 px-6 md:px-8 py-6 md:py-8">
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                   <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-0.5">
                   <CardTitle className="text-xl font-black tracking-tight">Cryptographic Ledger</CardTitle>
                   <CardDescription className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Real-time surveillance of institutional governance</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <AuditLogList logs={logs || []} />
          </CardContent>
          <div className="bg-muted/10 border-t border-border/40 px-10 py-6">
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 text-center animate-pulse">
                END OF CRYPTOGRAPHIC CHAIN — INTEGRITY GUARANTEED BY INSTITUTIONAL KEYSPACE
             </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
