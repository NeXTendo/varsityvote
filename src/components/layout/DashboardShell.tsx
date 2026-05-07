'use client'

import { Sidebar, NavItem } from './Sidebar'
import { MobileNav } from './MobileNav'
import { ShellProvider, useShell } from './ShellContext'

interface DashboardShellProps {
  children: React.ReactNode
  nav: NavItem[]
  institutionName?: string
  userEmail?: string
  userName?: string
}

function DashboardShellInner({
  children,
  nav,
  institutionName,
  userEmail,
  userName,
}: DashboardShellProps) {
  const { isMobileNavOpen, setIsMobileNavOpen } = useShell()

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      <Sidebar
        nav={nav}
        institutionName={institutionName}
        userEmail={userEmail}
        userName={userName}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        nav={nav}
        institutionName={institutionName}
        userEmail={userEmail}
        userName={userName}
      />
    </div>
  )
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <ShellProvider>
      <DashboardShellInner {...props} />
    </ShellProvider>
  )
}
