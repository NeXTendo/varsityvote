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
  Mail, 
  Lock, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const { toast } = useToast()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = schema.safeParse({ email, password })
    if (!result.success) {
      toast({
        title: 'Validation error',
        description: result.error.errors[0].message,
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      toast({
        title: 'Authentication failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    toast({
      title: 'Welcome back',
      description: 'You have successfully signed in.',
    })

    router.push(redirectTo ?? '/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
             Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="pl-12 pr-6 h-14 rounded-2xl bg-muted/20 border-none font-bold text-sm focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Password
            </Label>
            <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
              Recovery?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
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
            <span>AUTHENTICATING...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
             <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span>Login</span>
          </div>
        )}
      </Button>
    </form>
  )
}