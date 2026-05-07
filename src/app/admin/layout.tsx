import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Institution } from '@/types/database.types'
import {
  LayoutDashboard, Vote, Users, ClipboardList, ScrollText,
} from 'lucide-react'
import type { NavItem } from '@/components/layout/Sidebar'

const NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/admin/dashboard',   icon: 'LayoutDashboard' },
  { label: 'Elections',   href: '/admin/elections',   icon: 'Vote' },
  { label: 'Candidates',  href: '/admin/candidates',  icon: 'ClipboardList' },
  { label: 'Users',       href: '/admin/users',       icon: 'Users' },
  { label: 'Audit Log',   href: '/admin/audit',       icon: 'ScrollText' },
]

import { DashboardShell } from '@/components/layout/DashboardShell'
import { ScoreboardWidget } from '@/components/scoreboard/ScoreboardWidget'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['super_admin', 'election_admin'])

  const supabase = await createClient()
  const { data: institution } = await supabase
    .from('institutions')
    .select('name')
    .eq('id', profile.institution_id!)
    .single() as any as { data: Institution | null }

  return (
    <DashboardShell
      nav={NAV}
      institutionName={institution?.name}
      userEmail={profile.email}
      userName={profile.full_name}
    >
      {children}
      <ScoreboardWidget institutionId={profile.institution_id!} role={profile.role} />
    </DashboardShell>
  )
}