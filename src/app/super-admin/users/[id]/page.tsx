import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getUserById, updateUserDetails } from '@/lib/users'
import { getAuditLogs } from '@/lib/audit'
import { Topbar } from '@/components/layout/Topbar'
import { AuditTable } from '@/components/dashboard/AuditTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Shield, 
  Building2, 
  History, 
  UserCircle2, 
  Save,
  Mail,
  Calendar,
  KeyRound
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDateTime, cn } from '@/lib/utils'

export default async function UserDetailsPage({ params }: { params: { id: string } }) {
  await requireRole(['super_admin'])
  const supabase = await createClient()

  const [user, institutionsRes, logs] = await Promise.all([
    getUserById(params.id).catch(() => null),
    supabase.from('institutions').select('id, name').eq('is_active', true).order('name') as any,
    getAuditLogs({ userId: params.id, limit: 10 })
  ])

  if (!user) notFound()
  const institutions = institutionsRes.data ?? []

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar 
        title="Authority Profile" 
        description="Detailed credentials and historical registry for this system authority."
        actions={
          <Link href="/super-admin/users">
            <Button variant="outline" className="rounded-xl font-bold px-6 shadow-sm border-border/40 bg-background">
               <ArrowLeft className="w-4 h-4 mr-2" /> BACK TO LIST
            </Button>
          </Link>
        }
      />

      <div className="p-8 max-w-[1200px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
               <div className="h-2 bg-primary" />
               <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-start justify-between">
                     <div className="space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                           <UserCircle2 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                           <CardTitle className="text-3xl font-black tracking-tighter uppercase">{user.full_name}</CardTitle>
                           <CardDescription className="text-sm font-bold opacity-60 flex items-center gap-1.5 uppercase tracking-widest mt-1">
                              <Mail className="w-3.5 h-3.5" /> {user.email}
                           </CardDescription>
                        </div>
                     </div>
                     <Badge className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] bg-primary/10 text-primary border-primary/20">
                        {user.role.replace('_', ' ')}
                     </Badge>
                  </div>
               </CardHeader>
               <CardContent className="px-8 pb-8">
                  <form action={async (formData: FormData) => {
                     'use server'
                     const fullName = formData.get('fullName') as string
                     const role = formData.get('role') as any
                     const institutionId = formData.get('institutionId') as string
                     await updateUserDetails(user.id, {
                        fullName,
                        role,
                        institutionId: institutionId === 'none' ? null : institutionId
                     })
                  }} className="space-y-8 mt-4 pt-8 border-t border-border/40">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Display Identity</Label>
                           <Input 
                             name="fullName"
                             defaultValue={user.full_name || ''} 
                             className="rounded-xl border-border/40 bg-muted/20 h-11 font-medium"
                           />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">System Privilege</Label>
                           <select 
                             name="role"
                             title="Select User Role"
                             defaultValue={user.role}
                             className="w-full h-11 px-4 rounded-xl border-border/40 bg-muted/20 text-sm font-bold uppercase tracking-widest appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                           >
                              <option value="super_admin">SUPER ADMIN</option>
                              <option value="election_admin">ELECTION ADMIN</option>
                              <option value="candidate">CANDIDATE</option>
                              <option value="voter">VOTER</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Institutional Jurisdiction</Label>
                           <select 
                             name="institutionId"
                             title="Select Institutional Jurisdiction"
                             defaultValue={user.institution_id || 'none'}
                             className="w-full h-11 px-4 rounded-xl border-border/40 bg-muted/20 text-sm font-bold uppercase tracking-widest appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                           >
                              <option value="none">GLOBAL SYSTEM</option>
                              {institutions.map((i: any) => (
                                 <option key={i.id} value={i.id}>{i.name}</option>
                              ))}
                           </select>
                        </div>
                        <div className="space-y-3 opacity-40 cursor-not-allowed">
                           <Label className="text-[10px] font-black uppercase tracking-widest">Registry Timestamp</Label>
                           <div className="h-11 px-4 flex items-center rounded-xl border border-dashed border-border/60 bg-muted/10 text-xs font-mono">
                              {formatDateTime(user.created_at)}
                           </div>
                        </div>
                     </div>
                     <div className="flex justify-end pt-4">
                        <Button type="submit" className="rounded-xl font-black px-12 h-12 shadow-lg shadow-primary/20 uppercase tracking-[0.2em] text-[11px] bg-primary group">
                           <Save className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" /> UPDATE CREDENTIALS
                        </Button>
                     </div>
                  </form>
               </CardContent>
            </Card>

            {/* Logs Snippet */}
            <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
               <CardHeader className="bg-muted/40 border-b border-border/40 px-8 py-6">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <History className="w-4 h-4 text-primary" />
                     </div>
                     <CardTitle className="text-sm font-black uppercase tracking-widest">Individual Audit Trail</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <AuditTable logs={logs} />
                  {logs.length === 0 && (
                     <div className="p-12 text-center opacity-20">
                        <History className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No activity recorded for this user</p>
                     </div>
                  )}
                  {logs.length > 0 && (
                     <div className="p-4 bg-muted/20 border-t border-border/40 text-center">
                        <Link href={`/super-admin/audit?userId=${user.id}`}>
                           <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest hover:text-primary">VIEW FULL LOGS →</Button>
                        </Link>
                     </div>
                  )}
               </CardContent>
            </Card>
          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-8">
             <Card className="border-border/40 shadow-xl shadow-black/5 bg-background overflow-hidden">
                <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
                   <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-primary" /> Security Status
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account Status</span>
                         <Badge variant="success" className="text-[8px] font-black tracking-widest px-2">ACTIVE</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">MFA Enabled</span>
                         <Badge variant="outline" className="text-[8px] font-black tracking-widest px-2 opacity-30">DISABLED</Badge>
                      </div>
                   </div>
                   <div className="pt-6 border-t border-border/40 space-y-3">
                      <Button variant="outline" disabled className="w-full rounded-xl font-bold uppercase tracking-widest text-[9px] h-10 border-border/40 opacity-50">
                        <KeyRound className="w-3.5 h-3.5 mr-2" /> FORCE PASSWORD RESET
                      </Button>
                      <Button variant="destructive" disabled className="w-full rounded-xl font-black uppercase tracking-widest text-[9px] h-10 shadow-lg shadow-red-500/10 opacity-50">
                        SUSPEND AUTHORITY
                      </Button>
                   </div>
                </CardContent>
             </Card>

             <Card className="border-border/40 shadow-xl shadow-black/5 border-dashed bg-muted/5">
                <CardContent className="p-8 text-center space-y-3">
                   <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2 opacity-40">
                      <Building2 className="w-6 h-6" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Affiliated Content</p>
                   <p className="text-xs font-medium text-muted-foreground">This authority has access to 0 institutional elections and 0 mandates.</p>
                </CardContent>
             </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
