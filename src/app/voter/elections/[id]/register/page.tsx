'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { useRole } from '@/hooks/useRole'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Trophy, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  UserCircle,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Election, ElectionPosition } from '@/types/database.types'

interface Props { params: { id: string } }

export default function CandidateRegistrationPage({ params }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useRole()

  const [election, setElection] = useState<Election | null>(null)
  const [positions, setPositions] = useState<ElectionPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    position_id: '',
    bio: '',
    manifesto: '',
    manifesto_url: ''
  })

  useEffect(() => {
    async function fetchData() {
      if (!profile) return

      // Fetch election and positions
      const { data: el } = await supabase.from('elections').select('*').eq('id', params.id).single()
      const { data: pos } = await supabase.from('election_positions').select('*').eq('election_id', params.id)

      if (el) setElection(el as any)
      if (pos) setPositions(pos as any)
      setLoading(false)
    }
    fetchData()
  }, [params.id, profile, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !form.position_id) return
    setError(null)
    setSubmitting(true)

    // Check if already registered
    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('election_id', params.id)
      .eq('profile_id', profile.id)
      .eq('election_position_id', form.position_id)
      .maybeSingle()

    if (existing) {
      setError('You have already submitted an application for this position.')
      setSubmitting(false)
      return
    }

    const { error: err } = await supabase.from('candidates').insert({
      election_id: params.id,
      profile_id: profile.id,
      election_position_id: form.position_id,
      bio: form.bio,
      manifesto: form.manifesto,
      status: 'pending'
    })

    if (err) {
      setError(err.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => {
      router.push(`/voter/elections/${params.id}`)
    }, 3000)
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
              <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">Application Received</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-relaxed italic">
                Your candidacy application has been securely transmitted for institutional review. You will be notified once a decision is finalized.
              </p>
            </div>
            <div className="pt-4 flex justify-center">
               <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                 <div className="h-full bg-primary animate-[loading_3s_linear]" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Candidate Nomination" 
        description={`Secure application for the ${election?.title || 'Mandate'}`} 
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Card className="border-none bg-red-500/10 shadow-none overflow-hidden animate-in shake duration-500">
              <CardContent className="p-4 flex items-center gap-3 text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-6 md:px-10 py-6 md:py-8">
              <CardTitle className="text-xl">Mandate Selection</CardTitle>
              <CardDescription>Select the institutional position you wish to contest</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                  <Trophy className="w-3 h-3" /> Target Position <span className="text-primary">*</span>
                </Label>
                <div className="grid grid-cols-1 gap-4">
                  {positions.map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, position_id: pos.id }))}
                      className={cn(
                        "p-5 rounded-2xl border text-left transition-all relative group",
                        form.position_id === pos.id 
                          ? "bg-primary/5 border-primary shadow-xl shadow-primary/5" 
                          : "bg-background border-border/40 hover:border-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className={cn("font-black uppercase tracking-widest text-xs", form.position_id === pos.id ? "text-primary" : "text-foreground")}>
                            {pos.title}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground opacity-60 leading-relaxed italic">
                            {pos.description || 'Institutional mandate responsibilities apply.'}
                          </p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          form.position_id === pos.id ? "bg-primary border-primary text-white" : "border-border/40"
                        )}>
                          {form.position_id === pos.id && <ChevronRight className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Eligibility Verification</p>
                  <p className="text-[11px] font-medium leading-relaxed italic opacity-70">
                    By selecting a position, you confirm that you meet all institutional requirements (Faculty: {profile?.institution_id ? 'Verified' : 'Unverified'}, Academic Status: Active).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-6 md:px-10 py-6 md:py-8">
              <CardTitle className="text-xl">Candidate Briefing</CardTitle>
              <CardDescription>Official statement and manifesto for the student registry</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <UserCircle className="w-3 h-3" /> Candidate Bio <span className="text-primary">*</span>
                </Label>
                <Textarea
                  id="bio"
                  required
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Summarize your institutional experience and goals..."
                  className="rounded-2xl min-h-[120px] bg-muted/20 border-none p-6 font-medium leading-relaxed focus:ring-primary/20 transition-all text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manifesto" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Full Manifesto
                </Label>
                <Textarea
                  id="manifesto"
                  value={form.manifesto}
                  onChange={(e) => setForm(prev => ({ ...prev, manifesto: e.target.value }))}
                  placeholder="Detailed policy proposals and mission statement..."
                  className="rounded-2xl min-h-[200px] bg-muted/20 border-none p-6 font-medium leading-relaxed focus:ring-primary/20 transition-all text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 rounded-2xl h-16 font-black uppercase tracking-widest border-border/40 bg-background shadow-lg shadow-black/5"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.position_id}
              className="flex-2 w-[60%] rounded-2xl h-16 font-black uppercase tracking-widest shadow-2xl shadow-primary/20"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                   <span>TRANSMITTING...</span>
                </div>
              ) : 'SUBMIT CANDIDACY'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
