import { requireAuth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SecurityPrompt } from '@/components/auth/SecurityPrompt'
import { ScoreboardWidget } from '@/components/scoreboard/ScoreboardWidget'
import type { NavItem } from '@/components/layout/Sidebar'

const NAV: NavItem[] = [
  { label: 'Elections', href: '/voter/elections', icon: 'Vote' },
  { label: 'Results',   href: '/voter/results',   icon: 'Trophy' },
]

export default async function VoterLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth()

  return (
    <DashboardShell
      nav={NAV}
      institutionName="Voter Portal"
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