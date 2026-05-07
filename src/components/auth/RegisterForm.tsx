'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { User, Fingerprint, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  fullName:  z.string().min(2, 'Enter your full name'),
  studentId: z.string().min(2, 'Enter your student ID'),
  email:     z.string().email('Enter a valid institutional email'),
})

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()

  const { toast } = useToast()
  const [form, setForm] = useState({
    fullName: '', studentId: '', email: '', password: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = schema.omit({ password: true }).safeParse(form)
    if (!result.success) {
      toast({
        title: 'Validation error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    // Default password logic: first 2 letters of email + 12345
    const defaultPassword = form.email.substring(0, 2) + "12345"

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: defaultPassword,
      options: {
        data: {
          full_name:  form.fullName,
          student_id: form.studentId,
        },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    })

    if (signUpError) {
      toast({
        title: 'Registration failed',
        description: signUpError.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    toast({
      title: 'Identity Established',
      description: 'Account created with institutional default credentials.',
    })

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-3xl bg-green-500/20 blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/40">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-black tracking-tighter uppercase">Activate Identity</h3>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
            Institutional verification required. Your default password is: <span className="text-foreground font-black">{form.email.substring(0, 2)}12345</span>
          </p>
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 font-bold text-foreground inline-block">
             {form.email}
          </div>
        </div>
        <div className="space-y-3">
           <Link href="/login">
              <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                PROCEED TO LOGIN
              </Button>
           </Link>
           <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest opacity-60">
              You will be asked to secure your account after first login.
           </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 gap-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Full Legal Name
          </Label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input id="fullName" placeholder="John Mwale" value={form.fullName} onChange={handleChange('fullName')} className="pl-12 pr-6 h-14 rounded-2xl bg-muted/20 border-none font-bold text-sm focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Institutional ID
          </Label>
          <div className="relative group">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input id="studentId" placeholder="UNZA/2024/001" value={form.studentId} onChange={handleChange('studentId')} className="pl-12 pr-6 h-14 rounded-2xl bg-muted/20 border-none font-bold text-sm focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Institutional Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input id="email" type="email" placeholder="you@unza.zm" value={form.email} onChange={handleChange('email')} className="pl-12 pr-6 h-14 rounded-2xl bg-muted/20 border-none font-bold text-sm focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30" />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
         <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
           Institutional Detection Active
         </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-primary/20 text-md relative overflow-hidden group"
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>ESTABLISHING...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
             <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span>CREATE IDENTITY</span>
          </div>
        )}
      </Button>
    </form>
  )
}