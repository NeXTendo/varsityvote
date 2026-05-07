'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Fingerprint, 
  AlertCircle, 
  LayoutDashboard 
} from 'lucide-react'
import type { Candidate, Election } from '@/types/database.types'

type CandidateWithProfile = Candidate & {
  profiles: { full_name: string; avatar_url: string | null; student_id: string | null } | null
  election_positions: { id: string; title: string } | null
}

type Step = 'loading' | 'select' | 'confirm' | 'success' | 'error' | 'already_voted' | 'closed'

export default function VotePage() {
  const params   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [step, setStep]               = useState<Step>('loading')
  const [election, setElection]       = useState<Election | null>(null)
  const [candidates, setCandidates]   = useState<CandidateWithProfile[]>([])
  // byPosition maps position_id → candidates
  const [byPosition, setByPosition]   = useState<Record<string, CandidateWithProfile[]>>({})
  // positionTitles maps position_id → title
  const [positionTitles, setPositionTitles] = useState<Record<string, string>>({})
  const [selections, setSelections]   = useState<Record<string, string>>({}) // position_id → candidate_id
  const [token, setToken]             = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [receipt, setReceipt]         = useState<{ vote_id: string; vote_hash: string } | null>(null)
  const [errorMsg, setErrorMsg]       = useState<string>('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Load election
      const { data: el } = await supabase
        .from('elections')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!el || (el as any).status !== 'active') { setStep('closed'); return }
      setElection(el as any)

      // Check already voted
      const { data: existingToken } = await supabase
        .from('vote_tokens')
        .select('used')
        .eq('election_id', params.id)
        .eq('voter_id', user.id)
        .single()

      if ((existingToken as any)?.used) { setStep('already_voted'); return }

      // Load candidates with their position info
      const { data: cands } = await supabase
        .from('candidates')
        .select('*, profiles!candidates_profile_id_fkey(full_name, avatar_url, student_id), election_positions!inner(id, title)')
        .eq('election_id', params.id)
        .eq('status', 'approved') as any as { data: CandidateWithProfile[] | null }

      const typedCands = (cands ?? []) as CandidateWithProfile[]
      setCandidates(typedCands)

      const grouped: Record<string, CandidateWithProfile[]> = {}
      const titles: Record<string, string> = {}
      for (const c of typedCands) {
        const posId = c.election_positions?.id ?? 'unknown'
        const posTitle = c.election_positions?.title ?? 'Unknown Position'
        if (!grouped[posId]) grouped[posId] = []
        grouped[posId]!.push(c)
        titles[posId] = posTitle
      }
      setByPosition(grouped)
      setPositionTitles(titles)

      // Issue token
      const { data: tokenData, error: tokenErr } = await (supabase as any)
        .rpc('issue_vote_token', { p_election_id: params.id }) as any as { data: { token: string }[] | null, error: any }

      if (tokenErr || !tokenData?.[0]) {
        setErrorMsg(tokenErr?.message ?? 'Failed to issue voting token')
        setStep('error')
        return
      }

      setToken(tokenData[0].token)
      setStep('select')
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function selectCandidate(positionId: string, candidateId: string) {
    setSelections(prev => ({ ...prev, [positionId]: candidateId }))
  }

  const positions    = Object.keys(byPosition)
  const allSelected  = positions.every(pos => selections[pos])
  const totalVotes   = Object.keys(selections).length

  async function handleConfirm() {
    if (!token || !election) return
    setSubmitting(true)

    let lastResult: any = null

    for (const [positionId, candidateId] of Object.entries(selections)) {
      const { data, error } = await (supabase as any).rpc('cast_vote', {
        p_election_id:  election.id,
        p_candidate_id: candidateId,
        p_token:        token,
        p_position_id:  positionId,
      }) as any as { data: { vote_id: string, vote_hash: string } | null, error: any }

      if (error) {
        setErrorMsg(error.message)
        setStep('error')
        setSubmitting(false)
        return
      }
      lastResult = data
    }

    setReceipt({ vote_id: lastResult.vote_id, vote_hash: lastResult.vote_hash })
    setStep('success')
    setSubmitting(false)
  }

  // ── Render states ──────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
              <ShieldCheck className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Secure Verification</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Synchronizing cryptographic material...</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-8">
        <Card className="max-w-md w-full border-none shadow-2xl shadow-black/5 overflow-hidden">
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground opacity-40">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight uppercase">Mandate Suspended</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                This election portal is currently locked by the institutional registrar. Consult your administrator for the voting window.
              </p>
            </div>
            <Button onClick={() => router.back()} variant="outline" className="w-full rounded-xl font-black uppercase tracking-widest h-12">
              RETURN TO SAFETY
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'already_voted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-8">
        <Card className="max-w-md w-full border-none shadow-2xl shadow-black/5 overflow-hidden">
          <CardContent className="p-12 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-green-500/20 blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight uppercase">Mandate Recorded</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed italic opacity-80">
                Institutional records indicate your ballot for this mandate has already been cryptographically sealed.
              </p>
            </div>
            <Button onClick={() => router.push('/voter/elections')} className="w-full rounded-xl font-black uppercase tracking-widest h-12 shadow-xl shadow-primary/20">
              CLOSE TERMINAL
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-8">
        <Card className="max-w-md w-full border-none shadow-2xl shadow-black/5 overflow-hidden">
          <div className="h-2 bg-red-500" />
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight uppercase">Security Alert</h2>
              <p className="text-xs text-red-500 font-black uppercase tracking-widest opacity-60">System Fault Detected</p>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {errorMsg || "An unexpected cryptographic error occurred while preparing your ballot."}
              </p>
            </div>
            <Button onClick={() => router.back()} variant="outline" className="w-full rounded-xl font-black uppercase tracking-widest h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300">
              ABORT AND RETURN
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'success' && receipt) {
    return (
      <div className="min-h-screen bg-muted/20 py-20 px-8">
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-green-500/20 blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/40">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase">Ballot Sealed</h2>
              <p className="text-xs font-black text-green-600 uppercase tracking-[0.3em] opacity-80 italic">
                Your mandate has been anonymised and archived.
              </p>
            </div>
          </div>

          <Card className="border-none shadow-2xl shadow-black/5 overflow-hidden">
             <div className="px-8 py-4 bg-muted/40 border-b border-border/40 flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Official Vote Receipt</span>
                <Badge variant="outline" className="bg-background text-[10px] font-black text-primary uppercase">VERIFIED CERTIFICATE</Badge>
             </div>
             <CardContent className="p-10 space-y-8 bg-white/50 backdrop-blur-xl">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Transaction Signature</p>
                    <p className="text-[11px] font-mono break-all p-4 rounded-xl bg-muted/50 border border-border/40 font-bold text-foreground/80 leading-relaxed">
                      {receipt.vote_id}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Cryptographic Hash</p>
                    <p className="text-[11px] font-mono break-all p-4 rounded-xl bg-muted/50 border border-border/40 font-bold text-primary leading-relaxed">
                      {receipt.vote_hash}
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                   <div className="flex items-center gap-2 text-primary">
                      <Fingerprint className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Anonymisation Audit</p>
                   </div>
                   <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/80 italic">
                     This receipt is your institutional proof of participation. It verifies the existence of your vote in the audit trail without exposing your identity. Archive this record securely.
                   </p>
                </div>
             </CardContent>
             <div className="p-8">
               <Button
                 onClick={() => router.push('/voter/elections')}
                 className="w-full rounded-2xl font-black py-8 shadow-2xl shadow-primary/20 text-lg tracking-tighter"
               >
                 CLOSE SECURE SESSION
               </Button>
             </div>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-muted/20">
        <Topbar
          title="Review Mandate"
          description="Authenticate your final selections before institutional submission."
        />
        <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex gap-4">
             <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                <AlertCircle className="w-6 h-6 text-white" />
             </div>
             <div className="space-y-1">
                <p className="text-xs font-black text-orange-700 uppercase tracking-widest">Final Authorization Required</p>
                <p className="text-[11px] font-medium text-orange-600/80 leading-relaxed uppercase tracking-tight">
                  This mandate is final and cryptographically linked to your identity. Modification is impossible post-submission.
                </p>
             </div>
          </div>

          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <div className="px-8 py-5 bg-muted/40 border-b border-border/40">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Voter Ballot Summary</p>
            </div>
            <CardContent className="p-0 divide-y divide-border/40">
              {Object.entries(selections).map(([positionId, candidateId]) => {
                const c = candidates.find(x => x.id === candidateId)
                const p = c?.profiles as any
                const posTitle = positionTitles[positionId] ?? positionId
                return (
                  <div key={positionId} className="px-8 py-6 flex items-center justify-between group hover:bg-muted/30 transition-all duration-300">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">{posTitle}</p>
                      <p className="font-black text-lg tracking-tight text-foreground">{p?.full_name}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 scale-0 group-hover:scale-100 transition-transform duration-500 shadow-inner">
                       <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex gap-6">
            <Button
              onClick={() => setStep('select')}
              disabled={submitting}
              variant="outline"
              className="flex-1 rounded-2xl h-16 font-black uppercase tracking-widest border-border/40 bg-background shadow-lg shadow-black/5"
            >
              ← Edit Selections
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 rounded-2xl h-16 font-black uppercase tracking-widest shadow-2xl shadow-primary/20 relative overflow-hidden group"
            >
              {submitting ? (
                 <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                   <span>CERTIFYING...</span>
                 </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>SUBMIT MANDATE</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // step === 'select'
  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      <Topbar
        title={election?.title ?? 'Secure Ballot'}
        description="Institutional mandate: Select one certified candidate per position."
        actions={
          <Button
            onClick={() => setStep('confirm')}
            disabled={!allSelected}
            className="rounded-xl font-black px-8 shadow-xl shadow-primary/20 tracking-tighter disabled:opacity-30"
          >
            REVIEW MANDATE →
          </Button>
        }
      />

      <div className="p-8 space-y-12 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Progress */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                 <LayoutDashboard className="w-4 h-4" />
                 Ballot Progress
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                {Object.keys(selections).length} / {positions.length} Positions Sealed
              </span>
           </div>
           <Progress value={(Object.keys(selections).length / positions.length) * 100} className="h-1.5 bg-muted border border-border/20 shadow-inner" />
        </div>

        {Object.keys(byPosition).map(positionId => (
          <div key={positionId} className="space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full w-64 h-12" />
              <h2 className="text-xl font-black tracking-tighter text-foreground uppercase border-l-4 border-primary pl-6 py-1">
                {positionTitles[positionId]}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {byPosition[positionId]?.map(c => {
                const p        = c.profiles as any
                const selected = selections[positionId] === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCandidate(positionId, c.id)}
                    className={cn(
                      "group relative text-left rounded-3xl border-2 p-8 transition-all duration-500 hover:-translate-y-1",
                      selected
                        ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10 ring-4 ring-primary/5'
                        : 'border-border/40 bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-black/5'
                    )}
                  >
                    <div className="flex items-start justify-between mb-8">
                      <Avatar className={cn(
                        "w-20 h-20 rounded-2xl border-2 transition-all duration-500 shadow-inner",
                        selected ? "border-primary shadow-lg shadow-primary/20" : "border-border/40 group-hover:border-primary/40"
                      )}>
                        <AvatarImage src={c.photo_url || ""} alt={p?.full_name} className="object-cover" />
                        <AvatarFallback className="text-xl font-black bg-muted/60 text-muted-foreground/40 uppercase">
                          {p?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={cn(
                        "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                        selected ? "bg-primary border-primary shadow-lg shadow-primary/30" : "bg-muted/20 border-border group-hover:border-primary/40"
                      )}>
                        {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="font-black text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">{p?.full_name}</p>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-60">ID: {p?.student_id}</Badge>
                      </div>

                      {c.bio && (
                        <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/80 line-clamp-3 italic">
                          "{c.bio}"
                        </p>
                      )}
                    </div>

                    {/* Selection Glow */}
                    {selected && (
                      <div className="absolute inset-0 bg-primary/5 -z-10 blur-3xl rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}