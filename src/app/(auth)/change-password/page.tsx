import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Secure Your Identity | VarsityVote',
}

export default function ChangePasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
          Identity <br />
          <span className="text-primary">Verification</span>
        </h1>
        <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
          "Ensuring the integrity of your institutional credentials through personalized encryption."
        </p>
      </div>

      <ChangePasswordForm />

      <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
        VarsityVote Cryptographic Standard v2.4.0
      </p>
    </div>
  )
}
