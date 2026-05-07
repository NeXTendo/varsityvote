'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { 
  Lock, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export function ChangePasswordForm() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = schema.safeParse({ password, confirmPassword })
    if (!result.success) {
      toast({
        title: 'Validation error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    // 1. Update the password in auth
    const { error: authError } = await supabase.auth.updateUser({
      password: password
    })

    if (authError) {
      toast({
        title: 'Update failed',
        description: authError.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // 2. Update the profile to set require_password_change to false
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ require_password_change: false })
        .eq('id', user.id)

      if (profileError) {
        console.error('Failed to update profile flag:', profileError)
      }
    }

    setSuccess(true)
    toast({
      title: 'Security Updated',
      description: 'Your credential has been successfully reset.',
    })

    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 2000)
  }

  if (success) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black tracking-tighter uppercase text-foreground">Secure!</h3>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
            "Identity verified. Accessing institutional systems..."
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4 items-start">
         <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Mandatory Security Update</p>
            <p className="text-[10px] font-medium text-amber-500/70 leading-tight italic">
               "For your protection, default credentials must be replaced before proceeding to the dashboard."
            </p>
         </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
             New Security Key
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="pl-12 pr-6 h-14 rounded-2xl bg-muted/20 border-none font-bold text-sm focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
             Verify Security Key
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="pl-12 pr-6 h-14 rounded-2xl bg-muted/20 border-none font-bold text-sm focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-primary/20 text-md relative overflow-hidden group"
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>AUTHORIZING...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
             <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span>Secure Identity</span>
          </div>
        )}
      </Button>
    </form>
  )
}
