'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SecurityPromptProps {
  role: string
  requirePasswordChange?: boolean
}

export function SecurityPrompt({ role, requirePasswordChange }: SecurityPromptProps) {
  const [show, setShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only apply to voters and candidates
    if (!['voter', 'candidate'].includes(role)) return

    // If password change is required, show immediately
    if (requirePasswordChange) {
      setShow(true)
      return
    }

    const checkSecurityWindow = () => {
      const lastSeen = localStorage.getItem('vv_last_security_check')
      const now = Date.now()
      const fiveHours = 5 * 60 * 60 * 1000

      if (!lastSeen || now - parseInt(lastSeen) > fiveHours) {
        setShow(true)
      }
    }

    checkSecurityWindow()
  }, [role, requirePasswordChange])

  const handleDismiss = () => {
    localStorage.setItem('vv_last_security_check', Date.now().toString())
    setShow(false)
  }

  const handleAction = () => {
    localStorage.setItem('vv_last_security_check', Date.now().toString())
    router.push('/change-password')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-[#0A0F1E] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/40 backdrop-blur-3xl relative overflow-hidden group">
        {/* Animated Background Glow */}
        <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Account Security</p>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Identity Protection</h4>
            </div>
          </div>

          <p className="text-xs font-medium text-white/50 leading-relaxed italic">
            {requirePasswordChange 
              ? "\"Your account is currently using a default institutional credential. For your protection, we recommend establishing a unique security key.\""
              : "\"It has been over 5 hours since your last security verification. For institutional integrity, would you like to update your credentials?\""}
          </p>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleAction}
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-[11px] group"
            >
              Update Password <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleDismiss}
              className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white/30 hover:text-white hover:bg-white/5"
            >
              PROCEED WITH CURRENT
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
