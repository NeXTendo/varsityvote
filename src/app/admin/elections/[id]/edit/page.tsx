'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Users, 
  ShieldCheck, 
  LayoutDashboard, 
  AlertCircle,
  Settings2,
  Trash2
} from 'lucide-react'
import type { Election } from '@/types/database.types'
import { updateElection, updateElectionStatus } from '@/lib/elections'

export default function EditElectionPage() {
  const params  = useParams<{ id: string }>()
  const router  = useRouter()
  const supabase = createClient()
  const { profile } = useRole()

  const [form, setForm] = useState({
    title:        '',
    description:  '',
    voting_start: '',
    voting_end:   '',
    max_votes:    '1',
    status:       'draft',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (error || !data) {
        setError(error?.message || 'Election not found')
        setLoading(false)
        return
      }

      setForm({
        title:        data.title,
        description:  data.description || '',
        voting_start: data.voting_start ? new Date(data.voting_start).toISOString().slice(0, 16) : '',
        voting_end:   data.voting_end ? new Date(data.voting_end).toISOString().slice(0, 16) : '',
        max_votes:    data.max_votes.toString(),
        status:       data.status,
        scoreboard_config: data.scoreboard_config || {
          enabled_for_voters: false,
          enabled_for_candidates: false,
          enabled_for_admins: true,
          show_live_tallies: false
        },
      })
      setLoading(false)
    }
    load()
  }, [params.id, supabase])

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      await updateElection(params.id, {
        title:          form.title,
        description:    form.description || null,
        voting_start:   form.voting_start ? new Date(form.voting_start).toISOString() : null,
        voting_end:     form.voting_end   ? new Date(form.voting_end).toISOString()   : null,
        max_votes:      parseInt(form.max_votes, 10),
        status:         form.status as any,
        scoreboard_config: (form as any).scoreboard_config,
      })
      router.push(`/admin/elections/${params.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update election')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to cancel this election? This will archive it and prevent further voting.')) return
    try {
      await updateElectionStatus(params.id, 'cancelled')
      router.push('/admin/elections')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Edit Mandate" 
        description={`Modifying institutional parameters for: ${form.title}`}
      />

      <div className="p-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
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
            <CardHeader className="bg-muted/30 border-b border-border/40 px-6 md:px-8 py-5 md:py-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Primary Configuration</CardTitle>
                <CardDescription>Official title and mission overview</CardDescription>
              </div>
              <Settings2 className="w-5 h-5 opacity-20" />
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3" /> Election Title <span className="text-primary">*</span>
                </Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={handleChange('title')}
                  className="rounded-xl h-11 bg-muted/20 border-none px-5 font-bold text-base focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                  <LayoutDashboard className="w-3 h-3" /> Institutional Overview
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={handleChange('description')}
                  className="rounded-xl min-h-[100px] bg-muted/20 border-none p-5 font-medium leading-relaxed focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-6 md:px-8 py-5 md:py-6">
              <CardTitle className="text-lg">Mandate Timeline & Security</CardTitle>
              <CardDescription>Temporal window and voting constraints</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <Label htmlFor="voting_start" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" /> Window Opens
                  </Label>
                  <Input
                    id="voting_start"
                    type="datetime-local"
                    value={form.voting_start}
                    onChange={handleChange('voting_start')}
                    className="rounded-xl h-11 bg-muted/20 border-none px-5 font-bold focus:ring-primary/20 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voting_end" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" /> Window Closes
                  </Label>
                  <Input
                    id="voting_end"
                    type="datetime-local"
                    value={form.voting_end}
                    onChange={handleChange('voting_end')}
                    min={form.voting_start}
                    className="rounded-xl h-11 bg-muted/20 border-none px-5 font-bold focus:ring-primary/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-border/40">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" /> Current Phase
                  </Label>
                  <select 
                    id="status" 
                    value={form.status} 
                    onChange={handleChange('status')} 
                    className="w-full rounded-xl h-11 bg-muted/20 border-none px-5 font-bold appearance-none cursor-pointer focus:ring-primary/20 text-sm"
                  >
                    <option value="draft">DRAFT — FORMULATING</option>
                    <option value="active">ACTIVE — POLLING OPEN</option>
                    <option value="completed">COMPLETED — TALLYING</option>
                    <option value="cancelled">CANCELLED — VOIDED</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_votes" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                    <Users className="w-3 h-3" /> Ballot Weight
                  </Label>
                  <select 
                    id="max_votes" 
                    value={form.max_votes} 
                    onChange={handleChange('max_votes')} 
                    className="w-full rounded-xl h-11 bg-muted/20 border-none px-5 font-bold appearance-none cursor-pointer focus:ring-primary/20 text-sm"
                  >
                    <option value="1">1 — SINGLE MANDATE</option>
                    <option value="2">2 — DOUBLE MANDATE</option>
                    <option value="3">3 — TRIPLE MANDATE</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 border-t border-border/40 space-y-6">
                <div className="flex items-center gap-3 text-primary">
                  <LayoutDashboard className="w-5 h-5" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] pt-1">Scoreboard Visibility</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'enabled_for_voters', label: 'Visible to Voters' },
                    { id: 'enabled_for_candidates', label: 'Visible to Candidates' },
                    { id: 'enabled_for_admins', label: 'Visible to Admins' },
                    { id: 'show_live_tallies', label: 'Show Live Tallies' }
                  ].map(field => (
                    <div key={field.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 transition-all">
                      <Label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-widest opacity-60 cursor-pointer">{field.label}</Label>
                      <input 
                        type="checkbox" 
                        id={field.id}
                        checked={(form as any).scoreboard_config?.[field.id]}
                        onChange={(e) => {
                          const config = { ...((form as any).scoreboard_config || {}) }
                          config[field.id] = e.target.checked
                          setForm(prev => ({ ...prev, scoreboard_config: config }))
                        }}
                        className="w-5 h-5 rounded-lg border-muted bg-background text-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full md:flex-1 rounded-xl h-11 md:h-12 font-black uppercase tracking-widest border-border/40 bg-background shadow-lg shadow-black/5 text-[10px]"
            >
              BACK
            </Button>
            
            <Button
              type="submit"
              disabled={saving}
              className="w-full md:flex-[2] rounded-xl h-11 md:h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/10 text-[10px]"
            >
              {saving ? (
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                   <span>COMMITTING...</span>
                </div>
              ) : 'COMMIT CHANGES'}
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="w-full md:w-auto rounded-xl h-11 md:h-12 px-6 font-black uppercase tracking-widest bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all border-none"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
