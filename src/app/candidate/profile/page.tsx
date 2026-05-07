import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ShieldCheck, User, Mail, School, FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Candidate Profile' }

export default async function CandidateProfilePage() {
  const { profile } = await requireRole(['candidate', 'election_admin', 'super_admin'])
  
  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="Candidate Credentials"
        description="Verify and update your institutional profile and election media."
      />

      <div className="p-8 max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Profile Sidebar */}
          <div className="space-y-8">
            <Card className="border-none bg-primary shadow-2xl shadow-primary/20 overflow-hidden">
               <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                 <Avatar className="w-32 h-32 rounded-3xl border-4 border-white/20 shadow-2xl">
                   <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                   <AvatarFallback className="text-3xl font-black bg-white/10 text-white uppercase">
                     {profile.full_name?.split(' ').map(n => n[0]).join('')}
                   </AvatarFallback>
                 </Avatar>
                 <div className="space-y-1">
                   <h3 className="text-xl font-black text-white tracking-tighter">{profile.full_name}</h3>
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{profile.role.replace('_', ' ')}</p>
                 </div>
               </CardContent>
            </Card>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-[11px] font-black uppercase tracking-widest leading-none pt-1">Institutional Verified</h4>
              </div>
              <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground">
                Your basic identity data is synced with the institutional registrar. Only election-specific media can be modified here.
              </p>
            </div>
          </div>

          {/* Form Area */}
          <div className="md:col-span-2 space-y-8">
            <Card className="border-border/40 shadow-xl shadow-black/5">
              <CardHeader>
                <CardTitle>Institutional Identity</CardTitle>
                <CardDescription>Verified academic and contact record</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2 opacity-60 grayscale pointer-events-none">
                    <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <User className="w-3 h-3" /> Full Name
                    </Label>
                    <Input value={profile.full_name || ""} disabled className="rounded-xl h-12 bg-muted/20 border-none px-5 font-bold" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 opacity-60 grayscale pointer-events-none">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email
                      </Label>
                      <Input value={profile.email || ""} disabled className="rounded-xl h-12 bg-muted/20 border-none px-5 font-bold" />
                    </div>
                    <div className="space-y-2 opacity-60 grayscale pointer-events-none">
                      <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <School className="w-3 h-3" /> Registration ID
                      </Label>
                      <Input value={profile.student_id || "NOT SET"} disabled className="rounded-xl h-12 bg-muted/20 border-none px-5 font-bold" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl shadow-black/5">
              <CardHeader>
                <CardTitle>Election Presentation</CardTitle>
                <CardDescription>Public media for your candidate portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <form className="space-y-8">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Profile Bio
                     </Label>
                     <Textarea 
                       placeholder="Detail your experience and mandate goals..."
                       className="rounded-2xl min-h-[140px] bg-muted/10 border-border/40 p-5 font-medium leading-relaxed text-sm focus:ring-primary/20"
                     />
                   </div>

                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                        <ShieldCheck className="w-3 h-3" /> Institutional Manifesto (PDF)
                     </Label>
                     <div className="group relative border-2 border-dashed border-border/60 hover:border-primary/40 rounded-3xl p-10 transition-all flex flex-col items-center justify-center text-center space-y-4 cursor-pointer bg-muted/5">
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                           <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight text-foreground">Click to upload document</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Maximum size 5MB (Official PDF preferred)</p>
                        </div>
                     </div>
                   </div>

                   <Button className="w-full rounded-2xl font-black py-8 shadow-2xl shadow-primary/20 text-lg tracking-tighter">
                     UPDATE PUBLIC CREDENTIALS
                   </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
