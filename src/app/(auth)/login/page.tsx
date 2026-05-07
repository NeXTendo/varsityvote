import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string }
}) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-foreground">Welcome back</h1>
        <p className="text-sm font-medium text-muted-foreground tracking-tight">
          Sign in to your institutional portal
        </p>
      </div>

      {searchParams.error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-bold text-destructive text-center uppercase tracking-widest">
          {searchParams.error === 'unauthorized'
            ? 'Access Denied: Missing Permissions'
            : 'Authentication Error: Try Again'}
        </div>
      )}

      <div className="p-1">
        <LoginForm redirectTo={searchParams.redirect} />
      </div>

      <div className="text-center pt-2">
        <p className="text-sm font-medium text-muted-foreground">
          New to VarsityVote?{' '}
          <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}