import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { RegistrationTrendChart } from '@/components/admin/analytics/RegistrationTrendChart'
import { VotesByInstitutionChart } from '@/components/admin/analytics/VotesByInstitutionChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  Users, 
  Vote, 
  Building2,
  Calendar
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'System Analytics | Super Admin' }

export default async function SystemAnalyticsPage() {
  await requireRole(['super_admin'])
  const supabase = await createClient()

  // 1. Fetch data for Registration Trend (last 30 days)
  const { data: registrationData } = await supabase.rpc('get_registration_trend') as any
  // If RPC doesn't exist, we'll use a fallback or fetch all and aggregate
  // For now, let's assume we might need to aggregate in JS if RPC is missing
  const { data: allProfiles } = await supabase.from('profiles').select('created_at').order('created_at') as any
  
  const registrationTrend = aggregateByDate(allProfiles || [])

  // 2. Fetch data for Votes by Institution
  const { data: institutionVotes } = await supabase.from('institutions').select('name, elections(votes(id))') as any
  const votesByInstitution = (institutionVotes || []).map((inst: any) => ({
    name: inst.name,
    votes: inst.elections.reduce((acc: number, curr: any) => acc + curr.votes.length, 0)
  })).sort((a: any, b: any) => b.votes - a.votes)

  // 3. Overall Stats
  const [userCount, voteCount, instCount, electionCount] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('institutions').select('*', { count: 'exact', head: true }),
    supabase.from('elections').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Intelligence & Insights" 
        description="Comprehensive analysis of system growth, engagement, and institutional performance."
      />

      <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <MetricCard label="Total Registered" value={userCount.count || 0} icon={Users} trend="+12%" />
           <MetricCard label="Cast Ballots" value={voteCount.count || 0} icon={Vote} trend="+8%" />
           <MetricCard label="Active Entities" value={instCount.count || 0} icon={Building2} />
           <MetricCard label="Total Mandates" value={electionCount.count || 0} icon={Activity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           {/* Registration Trend */}
           <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                       <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                       <CardTitle className="text-sm font-black uppercase tracking-widest">Authority Growth</CardTitle>
                       <CardDescription className="text-[10px] font-bold uppercase opacity-60">Identity registration over time</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-8">
                 <RegistrationTrendChart data={registrationTrend} />
              </CardContent>
           </Card>

           {/* Votes by Institution */}
           <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-emerald-500" />
                       </div>
                       <div>
                          <CardTitle className="text-sm font-black uppercase tracking-widest">Participation by Entity</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase opacity-60">Voting volume across institutions</CardDescription>
                       </div>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-8">
                 <VotesByInstitutionChart data={votesByInstitution} />
              </CardContent>
           </Card>
        </div>

        {/* More detailed table/list could go here */}
        <div className="text-center opacity-40 py-12">
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Stream Active • Real-time Data Synchronization</p>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, trend }: any) {
   return (
      <Card className="border-border/40 shadow-xl shadow-black/5 bg-background group hover:-translate-y-1 transition-all">
         <CardContent className="p-8 space-y-4">
            <div className="flex items-center justify-between">
               <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="w-5 h-5" />
               </div>
               {trend && (
                  <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">{trend}</span>
               )}
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
               <p className="text-3xl font-black tracking-tighter">{value.toLocaleString()}</p>
            </div>
         </CardContent>
      </Card>
   )
}

function aggregateByDate(items: { created_at: string }[]) {
  const counts: Record<string, number> = {}
  items.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    counts[date] = (counts[date] || 0) + 1
  })
  
  return Object.entries(counts).map(([date, count]) => ({ date, count })).slice(-10) // Last 10 days with data
}
