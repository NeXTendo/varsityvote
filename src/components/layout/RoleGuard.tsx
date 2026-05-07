'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database.types'

const ROLE_HOME: Record<UserRole, string> = {
  super_admin:    '/super-admin/dashboard',
  election_admin: '/admin/dashboard',
  candidate:      '/candidate/dashboard',
  voter:          '/voter/elections',
}

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router   = useRouter()
  const supabase = createClient()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as any as { data: { role: UserRole } | null }

      const role = profile?.role ?? 'voter'
      if (!allowedRoles.includes(role)) {
        router.push(ROLE_HOME[role])
        return
      }

      setChecked(true)
    }
    check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
      </div>
    )
  }

  return <>{children}</>
}