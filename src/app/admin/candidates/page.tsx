import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { reviewCandidate } from '@/lib/candidates'
import { formatDate, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'
import type { Candidate, Profile, Election } from '@/types/database.types'

export const metadata: Metadata = { title: 'Candidate Approvals' }

export default async function CandidateApprovalsPage() {
  const { profile } = await requireRole(['super_admin', 'election_admin'])
  const supabase = await createClient()


  // Fetch pending candidates (filter by institution if not super_admin)
  let query = supabase
    .from('candidates')
    .select(`
      *,
      profiles!candidates_profile_id_fkey(full_name, email, student_id),
      elections!inner(title, institution_id),
      election_positions!inner(title)
    `)
  
  if (profile.role !== 'super_admin') {
    query = query.eq('elections.institution_id', profile.institution_id!)
  }

  const { data: candidates } = await query.order('created_at', { ascending: false }) as any as { data: (Candidate & { profiles: Profile, elections: Election })[] | null }

  const pending = candidates?.filter(c => c.status === 'pending') || []
  const history = candidates?.filter(c => c.status !== 'pending') || []

  return (
    <div>
      <Topbar 
        title="Candidate Approvals" 
        description="Review and approve nominations for upcoming elections"
      />

      <div className="p-6 space-y-8">
        {/* Pending */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Pending Review
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
              {pending.length}
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full py-8 text-center border rounded-xl border-dashed">
                No pending applications to review.
              </p>
            )}
            {pending.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{c.profiles?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Running for {(c as any).election_positions?.title}</p>
                  <p className="text-xs text-primary font-medium mt-1">{c.elections?.title}</p>
                </div>

                <div className="text-sm space-y-2">
                  <p className="line-clamp-3 text-muted-foreground">
                    {c.bio || "No bio provided."}
                  </p>
                  {c.manifesto_url && (
                    <a 
                      href={c.manifesto_url} 
                      target="_blank" 
                      className="text-xs text-primary hover:underline block"
                    >
                      View Manifesto PDF →
                    </a>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <form action={async () => {
                    'use server'
                    await reviewCandidate(c.id, 'approved', profile.id)
                  }} className="flex-1">
                    <button className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                      Approve
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await reviewCandidate(c.id, 'rejected', profile.id)
                  }} className="flex-1">
                    <button className="w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-accent">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 pb-20">
          <h2 className="text-lg font-black uppercase tracking-widest opacity-60">Recent Decisions</h2>
          <div className="space-y-4">
            {history.length === 0 && (
               <p className="text-sm text-muted-foreground py-8 text-center border rounded-xl border-dashed">
                 No archival review records found.
               </p>
            )}
            {history.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border/40 bg-card p-5 flex items-center justify-between group hover:bg-muted/30 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0",
                    c.status === 'approved' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                  )}>
                    {c.profiles?.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-black text-foreground tracking-tight truncate">{c.profiles?.full_name}</p>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                      <span>{(c as any).election_positions?.title}</span>
                      <span>•</span>
                      <span className="truncate">{c.elections?.title}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={c.status === 'approved' ? 'success' : 'destructive'} className="px-3 text-[9px] font-black uppercase tracking-widest">
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
