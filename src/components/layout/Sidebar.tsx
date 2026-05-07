'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LogOut, LayoutDashboard, ShieldCheck, Building2, Users,
  ScrollText, Vote, ClipboardList, UserCircle, Trophy, TrendingUp
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  Vote,
  ClipboardList,
  UserCircle,
  Trophy,
  TrendingUp,
}

export interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarProps {
  nav: NavItem[]
  institutionName?: string
  userEmail?: string
  userName?: string
  className?: string
  showLogo?: boolean
}

export function Sidebar({ nav, institutionName, userEmail, userName, className, showLogo = true }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={cn("hidden lg:flex h-full min-h-[100dvh] w-64 shrink-0 flex-col border-r border-border bg-card/50 backdrop-blur-xl", className)}>
      {/* Logo */}
      {showLogo && (
        <div className="flex h-16 items-center gap-3 px-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <ShieldCheck className="w-5 h-5 text-primary-foreground" />
        </div>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight leading-none">VarsityVote</p>
            {institutionName && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 truncate">
                {institutionName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon   = ICON_MAP[item.icon] || LayoutDashboard
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'opacity-100' : 'opacity-60')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-4 bg-muted/30 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-background shadow-sm shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {userName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate leading-tight">{userName ?? 'User'}</p>
            <p className="text-[10px] font-medium text-muted-foreground truncate uppercase tracking-tighter opacity-70">
              {userEmail}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10 shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}