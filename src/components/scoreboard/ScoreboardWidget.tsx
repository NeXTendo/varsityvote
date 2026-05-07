'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Trophy, 
  Settings2, 
  X, 
  GripHorizontal, 
  ChevronRight, 
  TrendingUp, 
  BarChart3,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ScoreboardWidgetProps {
  institutionId: string
  role: 'super_admin' | 'election_admin' | 'voter' | 'candidate'
}

export function ScoreboardWidget({ institutionId, role }: ScoreboardWidgetProps) {
  const supabase = createClient()
  const [election, setElection] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load user preferences
  useEffect(() => {
    const saved = localStorage.getItem('vv_pinned_candidates')
    if (saved) setPinnedIds(JSON.parse(saved))
  }, [])

  // Save user preferences
  useEffect(() => {
    localStorage.setItem('vv_pinned_candidates', JSON.stringify(pinnedIds))
  }, [pinnedIds])

  // Fetch active election and results
  useEffect(() => {
    async function fetchData() {
      // 1. Get active election with scoreboard enabled for this role
      const { data: el } = await supabase
        .from('elections')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('status', 'active')
        .single()

      if (!el) {
        setLoading(false)
        return
      }

      const config = el.scoreboard_config || {}
      const isVisible = 
        (role === 'voter' && config.enabled_for_voters) ||
        (role === 'candidate' && config.enabled_for_candidates) ||
        (['super_admin', 'election_admin'].includes(role) && config.enabled_for_admins)

      if (!isVisible) {
        setLoading(false)
        return
      }

      setElection(el)

      // 2. Fetch results if live tallies are enabled OR user is admin
      const canSeeTallies = config.show_live_tallies || ['super_admin', 'election_admin'].includes(role)
      
      if (canSeeTallies) {
        const { data: res } = await supabase.rpc('get_results', { p_election_id: el.id })
        setResults(res || [])
      } else {
        // Just fetch candidate list without counts if tallies are hidden
        const { data: cands } = await supabase
          .from('candidates')
          .select('id, profiles!candidates_profile_id_fkey(full_name), position')
          .eq('election_id', el.id)
          .eq('status', 'approved')
        
        setResults((cands || []).map(c => ({
          candidate_id: c.id,
          full_name: (c.profiles as any).full_name,
          position: c.position,
          vote_count: null // hidden
        })))
      }
      
      setLoading(false)
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [institutionId, role, supabase])

  if (loading || !election) return null

  const pinnedResults = results.filter(r => pinnedIds.includes(r.candidate_id))
  // If no pins, show top 2 overall
  const displayResults = pinnedResults.length > 0 ? pinnedResults : results.slice(0, 2)

  return (
    <div className="fixed z-[100] flex flex-col items-end gap-2 md:gap-4 pointer-events-none top-safe-offset-4 right-4 md:top-auto md:bottom-8 md:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            drag
            dragConstraints={{ top: 0, left: -300, right: 0, bottom: 600 }}
            dragMomentum={false}
            className="w-[90vw] md:w-80 bg-background/90 backdrop-blur-2xl border border-primary/20 rounded-[2.5rem] md:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden pointer-events-auto cursor-default"
          >
            {/* Header */}
            <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between cursor-move group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Live Mandate</p>
                  <p className="text-xs font-bold text-foreground truncate w-40">{election.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
                  onClick={() => setIsConfiguring(!isConfiguring)}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-red-500"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {isConfiguring ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Personal Tracker</h4>
                    <span className="text-[10px] font-bold text-primary">{pinnedIds.length} Pinned</span>
                  </div>
                  <div className="space-y-2">
                    {results.map(r => (
                      <button
                        key={r.candidate_id}
                        onClick={() => {
                          if (pinnedIds.includes(r.candidate_id)) {
                            setPinnedIds(prev => prev.filter(id => id !== r.candidate_id))
                          } else {
                            setPinnedIds(prev => [...prev, r.candidate_id])
                          }
                        }}
                        className={cn(
                          "w-full p-3 rounded-xl border flex items-center justify-between transition-all group",
                          pinnedIds.includes(r.candidate_id) 
                            ? "bg-primary/10 border-primary/20" 
                            : "bg-muted/30 border-transparent hover:border-primary/10"
                        )}
                      >
                        <div className="text-left">
                          <p className="text-xs font-black tracking-tight">{r.full_name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{r.position}</p>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded-full border transition-all",
                          pinnedIds.includes(r.candidate_id) ? "bg-primary border-primary" : "border-muted group-hover:border-primary/40"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayResults.length === 0 ? (
                    <div className="py-8 text-center opacity-30">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No candidates selected</p>
                    </div>
                  ) : (
                    displayResults.map(r => {
                      const totalVotes = results.reduce((sum, res) => sum + (res.vote_count || 0), 0)
                      const percent = totalVotes > 0 ? ((r.vote_count || 0) / totalVotes) * 100 : 0

                      return (
                        <div key={r.candidate_id} className="p-4 rounded-2xl bg-muted/40 border border-border/10 space-y-3 group hover:border-primary/20 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-xs font-black tracking-tight">{r.full_name}</p>
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-primary/20 text-primary">
                                {r.position}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black tracking-tighter text-foreground leading-none">
                                {r.vote_count !== null ? r.vote_count : '???'}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Votes</p>
                            </div>
                          </div>
                          {r.vote_count !== null && (
                            <div className="space-y-1.5">
                              <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/10">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  className="h-full bg-secondary shadow-[0_0_8px_rgba(165,0,33,0.4)]"
                                />
                              </div>
                              <p className="text-[9px] font-black text-secondary uppercase text-right">{percent.toFixed(1)}% Impact</p>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-12 md:h-14 md:w-14 rounded-2xl md:rounded-[1.75rem] shadow-2xl flex items-center justify-center transition-all pointer-events-auto relative group",
          isOpen ? "bg-background border-2 border-primary text-primary" : "bg-primary text-white"
        )}
      >
        <Trophy className={cn("w-5 h-5 md:w-6 md:h-6 transition-all", isOpen && "rotate-12")} />
        {!isOpen && pinnedIds.length > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white text-[10px] font-black flex items-center justify-center">
            {pinnedIds.length}
          </div>
        )}
        <div className="absolute -inset-2 bg-primary/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  )
}
