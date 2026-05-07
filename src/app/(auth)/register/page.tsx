import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-foreground">Join VarsityVote</h1>
        <p className="text-sm font-medium text-muted-foreground tracking-tight">
          Create your voter profile to participate
        </p>
      </div>

      <div className="p-1">
        <RegisterForm />
      </div>

      <div className="text-center pt-2">
        <p className="text-sm font-medium text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
