'use client'

import { X, ShieldCheck } from 'lucide-react'
import { Sidebar, NavItem } from './Sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  nav: NavItem[]
  institutionName?: string
  userEmail?: string
  userName?: string
}

export function MobileNav({
  isOpen,
  onClose,
  nav,
  institutionName,
  userEmail,
  userName,
}: MobileNavProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-background lg:hidden transition-transform duration-300 ease-in-out border-r border-border',
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-sm font-black tracking-tight leading-none">VarsityVote</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col h-[calc(100dvh-64px)]">
          {/* Reuse Sidebar component logic but without the outer 'aside' if possible, 
              or just wrap it. Since Sidebar has its own container, let's just use it 
              carefully or rebuild the internal nav here to avoid nested layout issues. 
              Actually, Sidebar is a client component, we can just pass props.
          */}
          <Sidebar
            nav={nav}
            institutionName={institutionName}
            userEmail={userEmail}
            userName={userName}
            showLogo={false}
            className="flex w-full border-r-0 h-full min-h-0"
          />
        </div>
      </div>
    </>
  )
}

// Overwrite the default Sidebar for MobileNav to remove the 'hidden lg:flex' class when used inside MobileNav
// Actually, it's better to just refactor Sidebar to accept a className
