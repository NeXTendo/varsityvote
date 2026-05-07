import { requireRole } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { LayoutDashboard, Building2, Users, ScrollText } from 'lucide-react'
import type { NavItem } from '@/components/layout/Sidebar'

const NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/super-admin/dashboard',    icon: 'LayoutDashboard' },
  { label: 'Analytics',    href: '/super-admin/analytics',    icon: 'TrendingUp' },
  { label: 'Institutions', href: '/super-admin/institutions', icon: 'Building2' },
  { label: 'All Users',    href: '/super-admin/users',        icon: 'Users' },
  { label: 'System Audit', href: '/super-admin/audit',        icon: 'ScrollText' },
]

import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(['super_admin'])

  return (
    <DashboardShell
      nav={NAV}
      institutionName="All Institutions"
      userEmail={profile.email}
      userName={profile.full_name}
    >
      {children}
    </DashboardShell>
  )
}