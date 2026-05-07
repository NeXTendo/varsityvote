import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ label, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <Card className="group hover:-translate-y-1 transition-all duration-500 border-border/40 shadow-xl shadow-black/5 overflow-hidden h-full flex flex-col">
      <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors duration-500" />
      <CardContent className="p-4 md:p-8 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-all duration-500 shadow-inner">
            <Icon className="w-4 h-4 md:w-5 md:h-5 stroke-[2]" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-tighter shadow-sm",
              trend.isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            )}>
              {trend.isPositive ? <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <TrendingDown className="w-2.5 h-2.5 md:w-3 md:h-3" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="space-y-1 md:space-y-2">
          <h3 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-tight">{label}</h3>
          <p className="text-2xl md:text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">{value}</p>
          {description && (
            <p className="hidden md:flex text-[11px] font-medium text-muted-foreground/50 mt-4 items-center gap-1.5 leading-tight italic border-t border-border/40 pt-4">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
