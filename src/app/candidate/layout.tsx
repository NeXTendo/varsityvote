import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Institution } from '@/types/database.types'
import { LayoutDashboard, UserCircle } from 'lucide-react'
import type { NavItem } from '@/components/layout/Sidebar'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SecurityPrompt } from '@/components/auth/SecurityPrompt'
import { ScoreboardWidget } from '@/components/scoreboard/ScoreboardWidget'

const NAV: NavItem[] = [
  { label: 'Dashboard',        href: '/candidate/dashboard', icon: 'LayoutDashboard' },
  { label: 'Apply for Position', href: '/candidate/apply',   icon: 'ClipboardList' },
  { label: 'My Profile',       href: '/candidate/profile',   icon: 'UserCircle' },
]

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['super_admin', 'election_admin', 'candidate'])

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
      <SecurityPrompt 
        role={profile.role} 
        requirePasswordChange={(profile as any).require_password_change} 
      />
      <ScoreboardWidget institutionId={profile.institution_id!} role={profile.role} />
    </DashboardShell>
  )
}