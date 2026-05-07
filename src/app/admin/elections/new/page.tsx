'use client'

import { useState } from 'react'
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
  FileText, 
  Calendar, 
  ShieldCheck, 
  LayoutDashboard, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Settings,
  Building2
} from 'lucide-react'
import { PositionManager, PositionData } from '@/components/admin/elections/PositionManager'
import { cn } from '@/lib/utils'
import type { ElectionCategory } from '@/types/database.types'

export default function NewElectionPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { profile } = useRole()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState({
    title:        '',
    description:  '',
    category:     'university' as ElectionCategory,
    voting_start: '',
    voting_end:   '',
    registration_deadline: '',
  })

  const [positions, setPositions] = useState<PositionData[]>([])

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit() {
    if (!profile) return
    if (positions.length === 0) {
      setError('At least one position is required.')
      return
    }

    setError(null)
    setLoading(true)

    // 1. Create Election
    const { data: election, error: elErr } = await (supabase.from('elections') as any)
      .insert({
        institution_id: profile.institution_id!,
        created_by:     profile.id,
        title:          form.title,
        description:    form.description || null,
        category:       form.category,
        voting_start:   form.voting_start ? new Date(form.voting_start).toISOString() : null,
        voting_end:     form.voting_end   ? new Date(form.voting_end).toISOString()   : null,
        registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null,
      })
      .select('id')
      .single()

    if (elErr || !election) {
      setError(elErr?.message || 'Failed to create election')
      setLoading(false)
      return
    }

    // 2. Create Positions
    const { error: posErr } = await (supabase.from('election_positions') as any)
      .insert(positions.map(p => ({
        election_id: election.id,
        title: p.title,
        description: p.description || null,
        max_winners: p.max_winners,
        max_candidates: p.max_candidates,
        eligibility_rules: p.eligibility_rules
      })))

    if (posErr) {
      setError(posErr.message || 'Election created, but failed to add positions. Please update them manually.')
      setLoading(false)
      // We don't redirect if positions fail, to let them try again or see error
      return
    }

    router.push(`/admin/elections/${election.id}`)
  }

  const nextStep = () => {
    if (step === 1) {
      if (!form.title) {
        setError('Election Title is required.')
        return
      }
      setError(null)
      setStep(2)
    }
  }

  const prevStep = () => {
    setError(null)
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title={step === 1 ? "Initiate Mandate" : "Mandate Structure"} 
        description={step === 1 ? "Step 1: Institutional & Timeline Configuration" : "Step 2: Position & Eligibility Definition"} 
      />

      <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-10 px-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all", step >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>1</div>
            <span className={cn("text-[9px] font-black uppercase tracking-widest", step === 1 ? "text-primary" : "text-muted-foreground opacity-50")}>Configuration</span>
          </div>
          <div className="h-px flex-1 bg-border/40" />
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all", step >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>2</div>
            <span className={cn("text-[9px] font-black uppercase tracking-widest", step === 2 ? "text-primary" : "text-muted-foreground opacity-50")}>Positions</span>
          </div>
        </div>

        {error && (
          <Card className="border-none bg-red-500/10 shadow-none overflow-hidden mb-8 animate-in shake duration-500">
            <CardContent className="p-4 flex items-center gap-3 text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
            </CardContent>
          </Card>
        )}

        {step === 1 ? (
          <div className="space-y-8">
            <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-6 md:px-10 py-6 md:py-8">
                <CardTitle className="text-xl">Primary Parameters</CardTitle>
                <CardDescription>Define the scope and category of this mandate</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Election Title <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="title"
                      required
                      value={form.title}
                      onChange={handleChange('title')}
                      placeholder="e.g. 2026 Student Union General Elections"
                      className="rounded-xl h-14 bg-muted/20 border-none px-6 font-bold text-lg focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> Mandate Category
                    </Label>
                    <div className="relative">
                      <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <select 
                        id="category" 
                        value={form.category} 
                        onChange={handleChange('category')} 
                        className="w-full rounded-xl h-14 bg-muted/20 border-none pl-12 pr-6 font-bold appearance-none cursor-pointer focus:ring-primary/20"
                      >
                        <option value="university">UNIVERSITY-WIDE</option>
                        <option value="faculty">FACULTY LEVEL</option>
                        <option value="department">DEPARTMENTAL</option>
                        <option value="club">CLUB & SOCIETY</option>
                        <option value="hostel">HOSTEL / RESIDENCE</option>
                        <option value="class">CLASS / YEAR REP</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <LayoutDashboard className="w-3 h-3" /> Overview
                    </Label>
                    <Input
                      id="description"
                      value={form.description}
                      onChange={handleChange('description')}
                      placeholder="Brief institutional context..."
                      className="rounded-xl h-14 bg-muted/20 border-none px-6 font-medium focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-6 md:px-10 py-6 md:py-8">
                <CardTitle className="text-xl">Temporal Windows</CardTitle>
                <CardDescription>Configuration of the voting and registration schedule</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="voting_start" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Voting Opens <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="voting_start"
                      type="datetime-local"
                      required
                      value={form.voting_start}
                      onChange={handleChange('voting_start')}
                      className="rounded-xl h-14 bg-muted/20 border-none px-6 font-bold focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voting_end" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Voting Closes <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="voting_end"
                      type="datetime-local"
                      required
                      value={form.voting_end}
                      onChange={handleChange('voting_end')}
                      min={form.voting_start}
                      className="rounded-xl h-14 bg-muted/20 border-none px-6 font-bold focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="registration_deadline" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" /> Candidate Registration Deadline
                    </Label>
                    <Input
                      id="registration_deadline"
                      type="datetime-local"
                      value={form.registration_deadline}
                      onChange={handleChange('registration_deadline')}
                      className="rounded-xl h-14 bg-muted/20 border-none px-6 font-bold focus:ring-primary/20 transition-all"
                    />
                    <p className="text-[9px] font-medium text-muted-foreground italic px-2">Registration usually closes before voting starts to allow for approval.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={nextStep}
                className="w-full md:w-auto rounded-xl h-16 px-10 font-black uppercase tracking-widest shadow-2xl shadow-primary/20 group transition-all"
              >
                STRUCTURE POSITIONS
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <PositionManager 
              positions={positions} 
              onChange={setPositions} 
            />

            <div className="flex items-center gap-6 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex-1 rounded-xl h-16 font-black uppercase tracking-widest border-border/40 bg-background shadow-lg shadow-black/5 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> BACK
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !profile || positions.length === 0}
                className="flex-2 w-[60%] rounded-xl h-16 font-black uppercase tracking-widest shadow-2xl shadow-primary/20"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                     <span>INITIALIZING...</span>
                  </div>
                ) : 'CONFIRM AND INITIATE'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}