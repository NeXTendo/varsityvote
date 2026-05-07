import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { InstitutionForm } from '@/components/admin/InstitutionForm'
import { toggleInstitutionStatus } from '@/lib/institutions'
import type { Metadata } from 'next'
import type { Institution } from '@/types/database.types'

export const metadata: Metadata = { title: 'Manage Institutions' }

export default async function InstitutionsPage() {
  await requireRole(['super_admin'])
  const supabase = await createClient()

  const { data: institutions } = await supabase
    .from('institutions')
    .select('*')
    .order('name') as { data: Institution[] | null }

  return (
    <div>
      <Topbar 
        title="Institutions" 
        description="Global list of all supported universities and colleges"
      />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {institutions?.map((inst) => (
                  <tr key={inst.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{inst.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inst.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inst.domain || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={async () => {
                        'use server'
                        await toggleInstitutionStatus(inst.id, !!inst.is_active)
                      }}>
                        <button
                          type="submit"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            inst.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {inst.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Add Form */}
        <div>
          <InstitutionForm />
        </div>
      </div>
    </div>
  )
}
