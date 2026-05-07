import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatDateTime, STATUS_LABEL, STATUS_COLOR, cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, Calendar, FileText } from 'lucide-react'
import { ElectionList } from '@/components/elections/ElectionList'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Election } from '@/types/database.types'

export const metadata: Metadata = { title: 'Elections' }

export default async function ElectionsPage() {
  const { profile } = await requireRole(['super_admin', 'election_admin'])
  const supabase = await createClient()

  const { data: elections } = await supabase
    .from('elections')
    .select('*')
    .eq('institution_id', profile.institution_id!)
    .order('created_at', { ascending: false }) as any as { data: Election[] | null }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 font-sans">
      <Topbar
        title="Election Registry"
        description="Oversee and manage institutional mandates for your organization."
        actions={
          <Link href="/admin/elections/new">
            <Button className="rounded-xl font-black px-8 shadow-xl shadow-primary/20 animate-in fade-in slide-in-from-right duration-500">
               <Plus className="w-4 h-4 mr-2" /> NEW MANDATE
            </Button>
          </Link>
        }
      />

      <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {!elections?.length ? (
          <Card className="border-2 border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-40 text-center opacity-40">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground">
                <FileText className="w-10 h-10 stroke-[1]" />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] mb-2">Registry Empty</h3>
              <p className="text-sm font-medium max-w-sm">
                No institutional mandates have been registered yet. Initiate a new mandate to begin.
              </p>
              <Link href="/admin/elections/new" className="mt-8">
                <Button variant="outline" className="rounded-xl font-black uppercase tracking-widest border-primary/20 text-primary">
                  INITIATE MANDATE
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ElectionList elections={elections} />
        )}
      </div>
    </div>
  )
}