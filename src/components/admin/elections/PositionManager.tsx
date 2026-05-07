'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Users, Trophy, Settings2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PositionData {
  id: string
  title: string
  description: string
  max_winners: number
  max_candidates: number
  eligibility_rules: {
    faculty?: string[]
    year?: number[]
    gender?: 'male' | 'female' | 'any'
  }
}

interface PositionManagerProps {
  positions: PositionData[]
  onChange: (positions: PositionData[]) => void
}

export function PositionManager({ positions, onChange }: PositionManagerProps) {
  const [isAdding, setIsAdding] = useState(false)

  const addPosition = () => {
    const newPos: PositionData = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      description: '',
      max_winners: 1,
      max_candidates: 10,
      eligibility_rules: {}
    }
    onChange([...positions, newPos])
  }

  const removePosition = (id: string) => {
    onChange(positions.filter(p => p.id !== id))
  }

  const updatePosition = (id: string, updates: Partial<PositionData>) => {
    onChange(positions.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight">Electoral Positions</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 italic">Define the mandates for this election</p>
        </div>
        <Button 
          type="button" 
          onClick={addPosition}
          className="rounded-xl h-11 px-6 font-black uppercase tracking-widest shadow-xl shadow-primary/20 group transition-all"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          ADD POSITION
        </Button>
      </div>

      {positions.length === 0 ? (
        <Card className="border-2 border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <Trophy className="w-12 h-12 mb-4 stroke-[1]" />
            <p className="text-xs font-black uppercase tracking-widest">No positions defined yet</p>
            <p className="text-[10px] font-medium mt-2 max-w-[200px]">At least one position is required to initiate an election.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {positions.map((pos, idx) => (
            <Card key={pos.id} className="border-border/40 shadow-xl shadow-black/5 overflow-hidden group animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                    {idx + 1}
                  </div>
                  <h4 className="font-black uppercase tracking-widest text-xs">
                    {pos.title || 'Untitled Position'}
                  </h4>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removePosition(pos.id)}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Position Title</Label>
                      <Input 
                        placeholder="e.g. Guild President" 
                        value={pos.title}
                        onChange={(e) => updatePosition(pos.id, { title: e.target.value })}
                        className="rounded-xl h-12 bg-muted/20 border-none px-4 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Mandate Description</Label>
                      <Textarea 
                        placeholder="Define the responsibilities..." 
                        value={pos.description}
                        onChange={(e) => updatePosition(pos.id, { description: e.target.value })}
                        className="rounded-xl min-h-[100px] bg-muted/20 border-none p-4 font-medium text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Winners</Label>
                        <div className="relative">
                          <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                          <Input 
                            type="number" 
                            min={1} 
                            value={pos.max_winners}
                            onChange={(e) => updatePosition(pos.id, { max_winners: parseInt(e.target.value) })}
                            className="rounded-xl h-12 bg-muted/20 border-none pl-10 font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Max Candidates</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                          <Input 
                            type="number" 
                            min={1} 
                            value={pos.max_candidates}
                            onChange={(e) => updatePosition(pos.id, { max_candidates: parseInt(e.target.value) })}
                            className="rounded-xl h-12 bg-muted/20 border-none pl-10 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/40 space-y-4">
                      <div className="flex items-center gap-2 text-primary opacity-80">
                        <Settings2 className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Eligibility Rules</span>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                        <div className="flex items-start gap-2">
                          <Info className="w-3 h-3 text-primary mt-0.5" />
                          <p className="text-[9px] font-medium leading-relaxed italic opacity-70">
                            Advanced rules (faculty, year, gender) can be configured here to restrict who can apply for this specific mandate.
                          </p>
                        </div>
                        {/* More complex rule inputs could be added here */}
                        <div className="pt-2">
                           <Button variant="outline" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest rounded-lg opacity-40 hover:opacity-100 transition-all border-primary/20">
                             CONFIGURE LOGIC
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
