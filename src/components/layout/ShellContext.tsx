'use client'

import { createContext, useContext, useState } from 'react'

interface ShellContextType {
  isMobileNavOpen: boolean
  setIsMobileNavOpen: (open: boolean) => void
}

const ShellContext = createContext<ShellContextType | undefined>(undefined)

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <ShellContext.Provider value={{ isMobileNavOpen, setIsMobileNavOpen }}>
      {children}
    </ShellContext.Provider>
  )
}

export function useShell() {
  const context = useContext(ShellContext)
  if (context === undefined) {
    throw new Error('useShell must be used within a ShellProvider')
  }
  return context
}
