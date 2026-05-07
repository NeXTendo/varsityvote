'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { useRole } from '@/hooks/useRole'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  UserCircle,
  Trophy,
  ShieldCheck,
  Users,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { params: { electionId: string; positionId: string } }

export default function CandidateApplyFormPage({ params }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useRole()

  const [election, setElection] = useState<any>(null)
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({ bio: '', manifesto: '' })

  useEffect(() => {
    async function fetchData() {
      if (!profile) return

      const [{ data: el }, { data: pos }] = await Promise.all([
        supabase.from('elections').select('*').eq('id', params.electionId).single(),
        supabase.from('election_positions').select('*').eq('id', params.positionId).single()
      ])

      if (!el || !pos) {
        setError('Election or position not found.')
        setLoading(false)
        return
      }

      // Check if already applied
      const { data: existing } = await supabase
        .from('candidates')
        .select('id, status')
        .eq('profile_id', profile.id)
        .eq('election_position_id', params.positionId)
        .maybeSingle()

      if (existing) {
        setError(`You have already submitted an application for this position (Status: ${existing.status}).`)
      }

      setElection(el)
      setPosition(pos)
      setLoading(false)
    }
    fetchData()
  }, [profile, params.electionId, params.positionId, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !election || !position) return
    if (!form.bio.trim()) { setError('A candidate bio is required.'); return }

    setError(null)
    setSubmitting(true)

    const { error: err } = await supabase.from('candidates').insert({
      election_id: params.electionId,
      profile_id: profile.id,
      election_position_id: params.positionId,
      bio: form.bio,
      manifesto: form.manifesto || null,
      status: 'pending'
    })

    if (err) {
      setError(err.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => router.push('/candidate/apply'), 3000)
  }

  if (loading) return null

  if (success) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-8 font-sans">
        <Card className="max-w-md w-full border-none shadow-2xl shadow-primary/10 overflow-hidden text-center">
          <div className="h-2 bg-primary animate-pulse" />
          <CardContent className="p-12 space-y-8">
            <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto shadow-xl shadow-primary/5">
              <CheckCircle2 className="w-10 h-10 text-primary stroke-[2.5]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Application Received</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-relaxed italic">
                Your candidacy for <strong>{position?.title}</strong> has been submitted for administrative review.
              </p>
            </div>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="Submit Candidacy"
        description={position ? `Applying for: ${position.title}` : 'Candidate Application'}
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">

        {/* Election & Position Summary */}
        {election && position && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-background border border-border/40 shadow-lg shadow-black/5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                {election.title.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Election</p>
                <p className="text-xs font-black truncate">{election.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/20 shadow-lg shadow-primary/5">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Applying For</p>
                <p className="text-xs font-black truncate text-primary">{position.title}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Card className="border-none bg-red-500/10 shadow-none">
              <CardContent className="p-4 flex items-center gap-3 text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-6 md:px-10 py-6">
              <CardTitle>Candidate Statement</CardTitle>
              <CardDescription>This information will be shown to voters and reviewed by administrators.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                  <UserCircle className="w-3 h-3" /> Candidate Bio <span className="text-primary">*</span>
                </Label>
                <Textarea
                  required
                  value={form.bio}
                  onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Summarize your institutional experience, qualifications, and motivation..."
                  className="rounded-xl min-h-[140px] bg-muted/20 border-none p-6 font-medium leading-relaxed text-xs focus:ring-primary/20"
                />
                <p className="text-[9px] font-bold text-muted-foreground opacity-50 italic px-1">This will appear on your public candidate card.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                  <FileText className="w-3 h-3" /> Full Manifesto
                </Label>
                <Textarea
                  value={form.manifesto}
                  onChange={(e) => setForm(p => ({ ...p, manifesto: e.target.value }))}
                  placeholder="Detailed policy proposals, institutional goals, and commitments..."
                  className="rounded-xl min-h-[220px] bg-muted/20 border-none p-6 font-medium leading-relaxed text-xs focus:ring-primary/20"
                />
                <p className="text-[9px] font-bold text-muted-foreground opacity-50 italic px-1">Optional but recommended. Shared with voters during the election.</p>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Notice */}
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Institutional Eligibility</p>
              <p className="text-[11px] font-medium leading-relaxed italic opacity-70">
                By submitting this application, you confirm you meet all institutional requirements for the selected position. Applications are reviewed by your institution's Electoral Commission.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 rounded-xl h-14 font-black uppercase tracking-widest border-border/40 bg-background shadow-lg shadow-black/5 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> BACK
            </Button>
            <Button
              type="submit"
              disabled={submitting || !!error || !profile}
              className="flex-2 w-[60%] rounded-xl h-14 font-black uppercase tracking-widest shadow-2xl shadow-primary/20"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>SUBMITTING...</span>
                </div>
              ) : 'SUBMIT CANDIDACY'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
