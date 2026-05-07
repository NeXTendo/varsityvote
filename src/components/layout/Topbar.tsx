'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShell } from './ShellContext'

interface TopbarProps {
  title: string
  description?: string
  actions?: React.ReactNode
  onMenuClick?: () => void
}

export function Topbar({ title, description, actions, onMenuClick }: TopbarProps) {
  const { setIsMobileNavOpen } = useShell()

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    } else {
      setIsMobileNavOpen(true)
    }
  }
  return (
    <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border bg-card/40 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={handleMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="space-y-0.5 md:space-y-1 truncate">
          <h1 className="text-lg md:text-xl font-black tracking-tight text-foreground truncate">{title}</h1>
          {description && (
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground/80 tracking-wide truncate">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 md:gap-3 shrink-0">{actions}</div>}
    </div>
  )
}